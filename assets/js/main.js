document.addEventListener('DOMContentLoaded', () => {
            document.body.classList.add('js-ready');

            const isTouch = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0) || window.matchMedia('(hover: none)').matches;
            const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

            // Performance optimization for small viewports
            if (window.innerWidth < 1024) {
                const noise = document.querySelector('.noise-overlay');
                if (noise) noise.style.display = 'none';
            }

            /* ========================================================
               1. SCROLL READING PROGRESS BAR
            ======================================================== */
            const progressBar = document.getElementById('scroll-progress');
            const updateProgressBar = () => {
                const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
                if (scrollHeight > 0 && progressBar) {
                    const progress = (window.scrollY / scrollHeight) * 100;
                    progressBar.style.width = `${Math.min(100, Math.max(0, progress))}%`;
                }
            };
            window.addEventListener('scroll', updateProgressBar, { passive: true });
            updateProgressBar();

            /* ========================================================
               2. BUTTERY 120FPS DUAL CURSOR (GSAP quickTo)
            ======================================================== */
            const ring = document.getElementById('ring');
            const dot = document.getElementById('cursor-dot');

            if (!isTouch && ring && dot && window.gsap) {
                const xToRing = gsap.quickTo(ring, "x", { duration: 0.35, ease: "power3.out" });
                const yToRing = gsap.quickTo(ring, "y", { duration: 0.35, ease: "power3.out" });
                const xToDot = gsap.quickTo(dot, "x", { duration: 0.08, ease: "power2.out" });
                const yToDot = gsap.quickTo(dot, "y", { duration: 0.08, ease: "power2.out" });

                window.addEventListener('mousemove', (e) => {
                    xToRing(e.clientX);
                    yToRing(e.clientY);
                    xToDot(e.clientX);
                    yToDot(e.clientY);
                }, { passive: true });

                const interactiveEls = document.querySelectorAll('a, button, .skill-unit, .timeline-row, .repo-item, .nav-btn, .nav-btn-ghost, .cert-modal-overlay, .cert-lightbox-trigger, .hero-meta-link, .hero-inline-link, .editorial-link, .univ-name-link');
                interactiveEls.forEach(el => {
                    el.addEventListener('mouseenter', () => {
                        gsap.to(ring, {
                            width: 62,
                            height: 62,
                            backgroundColor: 'rgba(201, 169, 110, 0.12)',
                            borderColor: 'rgba(201, 169, 110, 0.7)',
                            duration: 0.3,
                            ease: 'power2.out'
                        });
                        gsap.to(dot, { scale: 0, opacity: 0, duration: 0.2 });
                    });
                    el.addEventListener('mouseleave', () => {
                        gsap.to(ring, {
                            width: 38,
                            height: 38,
                            backgroundColor: 'transparent',
                            borderColor: 'var(--accent-gold)',
                            duration: 0.3,
                            ease: 'power2.out'
                        });
                        gsap.to(dot, { scale: 1, opacity: 1, duration: 0.2 });
                    });
                });
            } else {
                if (ring) ring.style.display = 'none';
                if (dot) dot.style.display = 'none';
            }

            /* ========================================================
               3. HERO AMBIENT NEURAL CANVAS
            ======================================================== */
            const canvas = document.getElementById('neural-canvas');
            const heroSection = document.getElementById('hero');

            if (canvas && heroSection && !prefersReducedMotion) {
                const ctx = canvas.getContext('2d');
                let nodes = [];
                let animFrameId = null;
                let isHeroVisible = true;
                let mouseX = -9999;
                let mouseY = -9999;

                const resizeCanvas = () => {
                    const rect = heroSection.getBoundingClientRect();
                    const dpr = Math.min(window.devicePixelRatio || 1, 2);
                    canvas.width = rect.width * dpr;
                    canvas.height = rect.height * dpr;
                    ctx.scale(dpr, dpr);
                    initNodes(rect.width, rect.height);
                };

                const initNodes = (width, height) => {
                    nodes = [];
                    // Keep node count gentle for ultra-smooth 60fps
                    const nodeCount = Math.min(48, Math.max(22, Math.floor(width / 32)));
                    for (let i = 0; i < nodeCount; i++) {
                        nodes.push({
                            x: Math.random() * width,
                            y: Math.random() * height,
                            vx: (Math.random() - 0.5) * 0.45,
                            vy: (Math.random() - 0.5) * 0.45,
                            radius: Math.random() * 1.8 + 1.2,
                            baseAlpha: Math.random() * 0.3 + 0.2
                        });
                    }
                };

                const updateAndDraw = () => {
                    if (!isHeroVisible) return;
                    const rect = heroSection.getBoundingClientRect();
                    const width = rect.width;
                    const height = rect.height;

                    ctx.clearRect(0, 0, width, height);

                    const connectDist = 135;
                    const connectDistSq = connectDist * connectDist;

                    // Draw connecting filaments
                    for (let i = 0; i < nodes.length; i++) {
                        for (let j = i + 1; j < nodes.length; j++) {
                            const dx = nodes[i].x - nodes[j].x;
                            const dy = nodes[i].y - nodes[j].y;
                            const distSq = dx * dx + dy * dy;

                            if (distSq < connectDistSq) {
                                const dist = Math.sqrt(distSq);
                                const alpha = (1 - dist / connectDist) * 0.22;
                                ctx.beginPath();
                                ctx.strokeStyle = `rgba(122, 96, 49, ${alpha})`;
                                ctx.lineWidth = 0.85;
                                ctx.moveTo(nodes[i].x, nodes[i].y);
                                ctx.lineTo(nodes[j].x, nodes[j].y);
                                ctx.stroke();
                            }
                        }
                    }

                    // Draw nodes & mouse interactions
                    for (let i = 0; i < nodes.length; i++) {
                        const n = nodes[i];

                        // Soft mouse influence
                        if (!isTouch && mouseX > -1000) {
                            const mdx = n.x - mouseX;
                            const mdy = n.y - mouseY;
                            const mDistSq = mdx * mdx + mdy * mdy;
                            if (mDistSq < 160 * 160 && mDistSq > 1) {
                                const mDist = Math.sqrt(mDistSq);
                                const force = (160 - mDist) / 160;
                                n.x += (mdx / mDist) * force * 1.2;
                                n.y += (mdy / mDist) * force * 1.2;

                                // Delicate tether line to mouse
                                ctx.beginPath();
                                ctx.strokeStyle = `rgba(122, 96, 49, ${force * 0.25})`;
                                ctx.lineWidth = 1;
                                ctx.moveTo(n.x, n.y);
                                ctx.lineTo(mouseX, mouseY);
                                ctx.stroke();
                            }
                        }

                        // Boundary wrap/bounce
                        n.x += n.vx;
                        n.y += n.vy;
                        if (n.x < 0) { n.x = 0; n.vx *= -1; }
                        if (n.x > width) { n.x = width; n.vx *= -1; }
                        if (n.y < 0) { n.y = 0; n.vy *= -1; }
                        if (n.y > height) { n.y = height; n.vy *= -1; }

                        // Render node
                        ctx.beginPath();
                        ctx.arc(n.x, n.y, n.radius, 0, Math.PI * 2);
                        ctx.fillStyle = `rgba(122, 96, 49, ${n.baseAlpha})`;
                        ctx.fill();
                    }

                    animFrameId = requestAnimationFrame(updateAndDraw);
                };

                heroSection.addEventListener('mousemove', (e) => {
                    const rect = heroSection.getBoundingClientRect();
                    mouseX = e.clientX - rect.left;
                    mouseY = e.clientY - rect.top;
                }, { passive: true });

                heroSection.addEventListener('mouseleave', () => {
                    mouseX = -9999;
                    mouseY = -9999;
                });

                window.addEventListener('resize', resizeCanvas);
                resizeCanvas();
                animFrameId = requestAnimationFrame(updateAndDraw);

                // Pause canvas off-screen to preserve battery & CPU
                if ('IntersectionObserver' in window) {
                    const heroObs = new IntersectionObserver((entries) => {
                        entries.forEach(entry => {
                            isHeroVisible = entry.isIntersecting;
                            if (isHeroVisible && !animFrameId) {
                                animFrameId = requestAnimationFrame(updateAndDraw);
                            }
                        });
                    }, { threshold: 0.05 });
                    heroObs.observe(heroSection);
                }
            }

            /* ========================================================
               4. 3D CARD PERSPECTIVE TILT & SPOTLIGHT
            ======================================================== */
            if (!isTouch && !prefersReducedMotion && window.gsap) {
                const tiltCards = document.querySelectorAll('.repo-item, .skill-unit');
                tiltCards.forEach(card => {
                    card.addEventListener('mousemove', (e) => {
                        const rect = card.getBoundingClientRect();
                        const x = e.clientX - rect.left;
                        const y = e.clientY - rect.top;

                        // Set spotlight gradient position
                        card.style.setProperty('--mouse-x', `${x}px`);
                        card.style.setProperty('--mouse-y', `${y}px`);

                        // 3D Perspective Rotation
                        const xPct = (x / rect.width - 0.5) * 2;
                        const yPct = (y / rect.height - 0.5) * 2;
                        const rotateX = -yPct * 4.5;
                        const rotateY = xPct * 4.5;

                        gsap.to(card, {
                            rotateX: rotateX,
                            rotateY: rotateY,
                            transformPerspective: 1000,
                            duration: 0.3,
                            ease: 'power1.out',
                            overwrite: 'auto'
                        });
                    });

                    card.addEventListener('mouseleave', () => {
                        gsap.to(card, {
                            rotateX: 0,
                            rotateY: 0,
                            duration: 0.65,
                            ease: 'power2.out',
                            overwrite: 'auto'
                        });
                    });
                });
            }

            /* ========================================================
               5. MAGNETIC BUTTON PHYSICS
            ======================================================== */
            if (!isTouch && !prefersReducedMotion && window.gsap) {
                const magnetics = document.querySelectorAll('.nav-btn, .nav-btn-ghost, .nav-logo, #hamburger-btn');
                magnetics.forEach(btn => {
                    btn.addEventListener('mousemove', (e) => {
                        const rect = btn.getBoundingClientRect();
                        const x = (e.clientX - (rect.left + rect.width / 2)) * 0.28;
                        const y = (e.clientY - (rect.top + rect.height / 2)) * 0.28;
                        gsap.to(btn, { x: x, y: y, duration: 0.3, ease: 'power2.out', overwrite: 'auto' });
                    });
                    btn.addEventListener('mouseleave', () => {
                        gsap.to(btn, { x: 0, y: 0, duration: 0.65, ease: 'elastic.out(1, 0.4)', overwrite: 'auto' });
                    });
                });
            }

            /* ========================================================
               6. LENIS INERTIA SMOOTH SCROLL ENGINE & SYNC
            ======================================================== */
            let lenis = null;
            if (typeof Lenis !== 'undefined' && !prefersReducedMotion) {
                lenis = new Lenis({
                    duration: 1.15,
                    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
                    orientation: 'vertical',
                    gestureOrientation: 'vertical',
                    smoothWheel: true,
                    wheelMultiplier: 0.95,
                    touchMultiplier: 1.25
                });

                lenis.on('scroll', ScrollTrigger.update);

                gsap.ticker.add((time) => {
                    lenis.raf(time * 1000);
                });

                gsap.ticker.lagSmoothing(0);
            }

            // Smooth internal anchor scrolling via Lenis
            document.querySelectorAll('a[href^="#"]').forEach(anchor => {
                anchor.addEventListener('click', (e) => {
                    const targetId = anchor.getAttribute('href');
                    if (!targetId || targetId === '#') return;
                    const targetEl = document.querySelector(targetId);
                    if (targetEl) {
                        e.preventDefault();
                        if (lenis) {
                            lenis.scrollTo(targetEl, { offset: -30, duration: 1.35 });
                        } else {
                            targetEl.scrollIntoView({ behavior: 'smooth' });
                        }
                    }
                });
            });

            /* ========================================================
               7. GSAP SCROLLTRIGGER CHOREOGRAPHY & PARALLAX KINETICS
            ======================================================== */
            if (window.gsap && window.ScrollTrigger && !prefersReducedMotion) {
                gsap.registerPlugin(ScrollTrigger);

                // Elegant Hero entrance timeline
                const heroTl = gsap.timeline({ defaults: { ease: "power3.out" } });
                heroTl.from(".hero-main-title", { y: 45, opacity: 0, duration: 1.0, delay: 0.1 })
                      .from(".hero-subtitle", { y: 24, opacity: 0, duration: 0.8 }, "-=0.7")
                      .from(".hero-meta-strip", { y: 18, opacity: 0, duration: 0.7 }, "-=0.65")
                      .from(".hero-narrative", { y: 20, opacity: 0, duration: 0.75 }, "-=0.6")
                      .from(".hero-pills > *", { y: 14, opacity: 0, stagger: 0.08, duration: 0.65 }, "-=0.55")
                      .from(".hero-action-group > *", { y: 16, opacity: 0, stagger: 0.1, duration: 0.65 }, "-=0.5")
                      .from(".hero-portrait-frame", { scale: 0.94, opacity: 0, duration: 1.0, ease: "power2.out" }, "-=0.85");

                // Parallax depth on Hero showcase portrait as user scrolls
                gsap.to(".hero-portrait-frame", {
                    yPercent: 10,
                    scale: 1.03,
                    ease: "none",
                    scrollTrigger: {
                        trigger: "#hero",
                        start: "top top",
                        end: "bottom top",
                        scrub: true
                    }
                });

                // Section Separators: Elegant line expansion and badge pop
                document.querySelectorAll('.section-separator').forEach(sep => {
                    const lines = sep.querySelectorAll('.line');
                    const num = sep.querySelector('.num');
                    if (lines.length && num) {
                        gsap.fromTo(lines, 
                            { scaleX: 0, opacity: 0 },
                            {
                                scaleX: 1,
                                opacity: 1,
                                duration: 1.0,
                                ease: "power2.out",
                                scrollTrigger: {
                                    trigger: sep,
                                    start: "top 88%",
                                    once: true
                                }
                            }
                        );
                        gsap.fromTo(num,
                            { scale: 0.7, opacity: 0 },
                            {
                                scale: 1,
                                opacity: 0.85,
                                duration: 0.65,
                                ease: "back.out(1.8)",
                                scrollTrigger: {
                                    trigger: sep,
                                    start: "top 88%",
                                    once: true
                                }
                            }
                        );
                    }
                });

                // Section Tags & Headings: Kinetic Reveal
                document.querySelectorAll('section.reveal, section.contact-blk').forEach(sec => {
                    const tag = sec.querySelector('.section-tag');
                    const heading = sec.querySelector('.h-large, .contact-h');
                    if (tag) {
                        gsap.fromTo(tag,
                            { opacity: 0, x: -22 },
                            {
                                opacity: 0.85,
                                x: 0,
                                duration: 0.75,
                                ease: "power2.out",
                                scrollTrigger: {
                                    trigger: tag,
                                    start: "top 90%",
                                    once: true
                                }
                            }
                        );
                    }
                    if (heading) {
                        gsap.fromTo(heading,
                            { opacity: 0, y: 32 },
                            {
                                opacity: 1,
                                y: 0,
                                duration: 0.85,
                                ease: "power3.out",
                                scrollTrigger: {
                                    trigger: heading,
                                    start: "top 88%",
                                    once: true
                                }
                            }
                        );
                    }
                });

                // Metric Counters Count-up on Scroll
                ScrollTrigger.create({
                    trigger: '.about-stats',
                    start: 'top 88%',
                    once: true,
                    onEnter: () => {
                        document.querySelectorAll('.about-stat-num').forEach(el => {
                            const rawTarget = el.getAttribute('data-target');
                            const suffix = el.getAttribute('data-suffix') || '';
                            const target = parseFloat(rawTarget);
                            if (!isNaN(target)) {
                                const counterObj = { val: 0 };
                                gsap.to(counterObj, {
                                    val: target,
                                    duration: 1.8,
                                    ease: 'power2.out',
                                    onUpdate: () => {
                                        el.innerText = Math.round(counterObj.val) + suffix;
                                    }
                                });
                            }
                        });
                    }
                });

                // Skills Units: Staggered Elevation
                ScrollTrigger.batch(".skill-unit", {
                    start: "top 88%",
                    once: true,
                    onEnter: batch => gsap.fromTo(batch,
                        { opacity: 0, y: 28 },
                        { opacity: 1, y: 0, stagger: 0.1, duration: 0.75, ease: "power2.out", clearProps: "all" }
                    )
                });

                // Repositories & Experience Staggered Batches
                ScrollTrigger.batch(".repo-item", {
                    start: "top 88%",
                    once: true,
                    onEnter: batch => gsap.fromTo(batch, 
                        { opacity: 0, y: 25 },
                        { opacity: 1, y: 0, stagger: 0.1, duration: 0.7, ease: "power2.out", clearProps: "opacity,transform" }
                    )
                });

                ScrollTrigger.batch(".timeline-row", {
                    start: "top 88%",
                    once: true,
                    onEnter: batch => gsap.fromTo(batch,
                        { opacity: 0, y: 20 },
                        { opacity: 1, y: 0, stagger: 0.1, duration: 0.7, ease: "power2.out", clearProps: "opacity,transform" }
                    )
                });

                // Kinetic Scroll Velocity deformation on Cursor Ring
                if (!isTouch && ring) {
                    const stretchY = gsap.quickTo(ring, "scaleY", { duration: 0.25, ease: "power2.out" });
                    const squashX = gsap.quickTo(ring, "scaleX", { duration: 0.25, ease: "power2.out" });

                    ScrollTrigger.create({
                        onUpdate: (self) => {
                            const v = Math.abs(self.getVelocity());
                            if (v > 100) {
                                const factor = Math.min(1.45, 1 + v / 3500);
                                const inv = Math.max(0.65, 1 - v / 7000);
                                stretchY(factor);
                                squashX(inv);
                            }
                        },
                        onScrubComplete: () => {
                            stretchY(1);
                            squashX(1);
                        }
                    });
                }
            }

            /* ========================================================
               8. REVEAL OBSERVER FALLBACK
            ======================================================== */
            const revealElements = document.querySelectorAll('.reveal');
            if ('IntersectionObserver' in window) {
                const obs = new IntersectionObserver(entries => {
                    entries.forEach(entry => {
                        if (entry.isIntersecting) {
                            requestAnimationFrame(() => {
                                entry.target.classList.add('visible');
                            });
                            obs.unobserve(entry.target);
                        }
                    });
                }, { threshold: 0.05, rootMargin: '0px 0px -50px 0px' });
                revealElements.forEach(el => obs.observe(el));
            } else {
                revealElements.forEach(el => el.classList.add('visible'));
            }

            /* ========================================================
               9. LUXURY TOAST & QUICK-COPY MICRO-INTERACTION
            ======================================================== */
            const toast = document.getElementById('luxury-toast');
            const toastMsg = document.getElementById('toast-message');
            let toastTimer = null;

            const showToast = (message) => {
                if (!toast) return;
                if (toastMsg) toastMsg.innerText = message;
                toast.classList.add('active');
                if (toastTimer) clearTimeout(toastTimer);
                toastTimer = setTimeout(() => {
                    toast.classList.remove('active');
                }, 2800);
            };

            const emailLink = document.getElementById('contact-email');
            if (emailLink) {
                emailLink.addEventListener('click', (e) => {
                    const copyText = emailLink.getAttribute('data-copy');
                    if (copyText && navigator.clipboard && navigator.clipboard.writeText) {
                        navigator.clipboard.writeText(copyText).then(() => {
                            showToast(`Copied ${copyText} to clipboard!`);
                        }).catch(() => {});
                    }
                });
            }

            /* ========================================================
               10. BACK TO TOP BUTTON & NAVIGATION SCROLL SPY
            ======================================================== */
            const nav = document.getElementById('nav');
            const backToTopBtn = document.getElementById('back-to-top');
            const desktopNavLinks = document.querySelectorAll('.nav-links .nav-link');
            const mobileLinks = document.querySelectorAll('.mobile-link');
            const scrollSections = document.querySelectorAll('section[id]');

            const onScrollHandler = () => {
                const scrollY = window.scrollY;

                // Nav Scrolled State
                if (nav) nav.classList.toggle('scrolled', scrollY > 60);

                // Back to Top Button Visibility
                if (backToTopBtn) {
                    backToTopBtn.classList.toggle('visible', scrollY > 450);
                }

                // Nav Active Spy
                const scrollPos = scrollY + 220;
                let activeId = '';
                scrollSections.forEach(sec => {
                    const top = sec.offsetTop;
                    const height = sec.offsetHeight;
                    if (scrollPos >= top && scrollPos < top + height) {
                        activeId = sec.getAttribute('id');
                    }
                });

                if (activeId) {
                    desktopNavLinks.forEach(link => {
                        link.classList.toggle('active', link.getAttribute('href') === `#${activeId}`);
                    });
                    mobileLinks.forEach(link => {
                        link.classList.toggle('is-active', link.getAttribute('href') === `#${activeId}`);
                    });
                }
            };

            window.addEventListener('scroll', onScrollHandler, { passive: true });

            if (backToTopBtn) {
                backToTopBtn.addEventListener('click', () => {
                    if (lenis) {
                        lenis.scrollTo(0, { duration: 1.4 });
                    } else {
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                    }
                });
            }

            /* ========================================================
               11. MOBILE MENU DRAWER LOGIC
            ======================================================== */
            const menuBtn = document.getElementById('hamburger-btn');
            const closeBtn = document.getElementById('overlay-close-btn');
            const overlay = document.getElementById('mobile-overlay');

            if (menuBtn && overlay) {
                const openMenu = () => {
                    overlay.classList.add('active');
                    menuBtn.classList.add('open');
                    document.body.style.overflow = 'hidden';
                    if (lenis) lenis.stop();
                };
                const closeMenu = () => {
                    overlay.classList.remove('active');
                    menuBtn.classList.remove('open');
                    document.body.style.overflow = '';
                    if (lenis) lenis.start();
                };

                menuBtn.addEventListener('click', () => overlay.classList.contains('active') ? closeMenu() : openMenu());
                if (closeBtn) closeBtn.addEventListener('click', closeMenu);
                mobileLinks.forEach(l => l.addEventListener('click', closeMenu));
            }

            /* ========================================================
               12. CERTIFICATE LIGHTBOX MODAL LOGIC
            ======================================================== */
            const certModal = document.getElementById('cert-modal');
            const certModalOverlay = document.getElementById('cert-modal-overlay');
            const certModalClose = document.getElementById('cert-modal-close');
            const certModalImg = document.getElementById('cert-modal-img');
            const certModalTitle = document.getElementById('cert-modal-title');
            const certModalMeta = document.getElementById('cert-modal-meta');
            const certModalFullview = document.getElementById('cert-modal-fullview');

            const openCertModal = (src, title, meta) => {
                if (!certModal) return;
                if (src && certModalImg) certModalImg.src = src;
                if (src && certModalFullview) certModalFullview.href = src;
                if (title && certModalTitle) certModalTitle.innerHTML = title;
                if (meta && certModalMeta) certModalMeta.innerHTML = meta;
                certModal.classList.add('active');
                certModal.setAttribute('aria-hidden', 'false');
                document.body.style.overflow = 'hidden';
                if (lenis) lenis.stop();
                if (ring && dot && window.gsap) {
                    gsap.to(ring, {
                        width: 38,
                        height: 38,
                        backgroundColor: 'transparent',
                        borderColor: 'var(--accent-gold)',
                        duration: 0.2,
                        ease: 'power2.out'
                    });
                    gsap.to(dot, { scale: 1, opacity: 1, duration: 0.2 });
                }
            };

            const closeCertModal = () => {
                if (!certModal) return;
                certModal.classList.remove('active');
                certModal.setAttribute('aria-hidden', 'true');
                document.body.style.overflow = '';
                if (lenis) lenis.start();
                if (ring && dot && window.gsap) {
                    gsap.to(ring, {
                        width: 38,
                        height: 38,
                        backgroundColor: 'transparent',
                        borderColor: 'var(--accent-gold)',
                        duration: 0.25,
                        ease: 'power2.out'
                    });
                    gsap.to(dot, { scale: 1, opacity: 1, duration: 0.2 });
                }
            };

            document.querySelectorAll('.cert-lightbox-trigger').forEach(trigger => {
                trigger.addEventListener('click', (e) => {
                    // Allow normal opening in new tab if user ctrl/meta clicked
                    if (e.ctrlKey || e.metaKey) return;
                    e.preventDefault();
                    const src = trigger.getAttribute('data-cert-src') || trigger.getAttribute('href');
                    const title = trigger.getAttribute('data-cert-title') || 'Official Rank Certificate';
                    const meta = trigger.getAttribute('data-cert-meta') || 'Verified Credential';
                    openCertModal(src, title, meta);
                });
            });

            if (certModalClose) certModalClose.addEventListener('click', closeCertModal);
            if (certModalOverlay) certModalOverlay.addEventListener('click', closeCertModal);
            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape' && certModal && certModal.classList.contains('active')) {
                    closeCertModal();
                }
            });

            /* ========================================================
               13. HERO PORTRAIT SWITCHER (EXECUTIVE / ARTISTIC)
            ======================================================== */
            const btnExec = document.getElementById('btn-portrait-executive');
            const btnArt = document.getElementById('btn-portrait-artistic');
            const imgExec = document.getElementById('hero-img-executive');
            const imgArt = document.getElementById('hero-img-artistic');

            if (btnExec && btnArt && imgExec && imgArt) {
                btnExec.addEventListener('click', () => {
                    btnExec.classList.add('active');
                    btnExec.setAttribute('aria-selected', 'true');
                    btnArt.classList.remove('active');
                    btnArt.setAttribute('aria-selected', 'false');
                    imgExec.classList.add('active');
                    imgArt.classList.remove('active');
                });

                btnArt.addEventListener('click', () => {
                    btnArt.classList.add('active');
                    btnArt.setAttribute('aria-selected', 'true');
                    btnExec.classList.remove('active');
                    btnExec.setAttribute('aria-selected', 'false');
                    imgArt.classList.add('active');
                    imgExec.classList.remove('active');
                });
            }
        });
