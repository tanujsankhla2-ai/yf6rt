document.addEventListener("DOMContentLoaded", () => {
    
    // 0. Preloader Logic
    const preloader = document.getElementById('preloader');
    if (preloader) {
        // Prevent scrolling while loading
        document.body.style.overflow = 'hidden';
        
        window.addEventListener('load', () => {
            setTimeout(() => {
                preloader.classList.add('fade-out');
                document.body.style.overflow = ''; // Restore scrolling
            }, 1000); // Small buffer for smooth entry
        });
    }
    
    // Mobile Menu Toggle with Accessibility
    const menuIcon = document.getElementById('menu-icon');
    const navLinks = document.getElementById('nav-links');
    if (menuIcon && navLinks) {
        // Toggle menu on click
        menuIcon.addEventListener('click', (e) => {
            e.stopPropagation();
            const isActive = navLinks.classList.toggle('active');
            menuIcon.setAttribute('aria-expanded', isActive);
        });
        
        // Close menu on link click
        navLinks.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                navLinks.classList.remove('active');
                menuIcon.setAttribute('aria-expanded', false);
            });
        });
        
        // Close menu when clicking outside (but not on menu itself)
        document.addEventListener('click', (e) => {
            const isNavClick = e.target.closest('.navbar');
            const isMenuClick = e.target.closest('.menu-icon');
            
            if (!isNavClick && navLinks.classList.contains('active')) {
                navLinks.classList.remove('active');
                menuIcon.setAttribute('aria-expanded', false);
            }
        });
        
        // Close menu on Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && navLinks.classList.contains('active')) {
                navLinks.classList.remove('active');
                menuIcon.setAttribute('aria-expanded', false);
                menuIcon.focus();
            }
        });
        
        // Prevent menu from closing when clicking inside it
        navLinks.addEventListener('click', (e) => {
            if (e.target === navLinks) {
                // Only close if clicking on the background
            }
        });
    }

    // 1. Navbar Scroll Effect
    const navbar = document.querySelector('.navbar');
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    });

    // 2. FAQ Accordion Logic
    const faqItems = document.querySelectorAll('.faq-question');
    faqItems.forEach(item => {
        item.addEventListener('click', () => {
            const isActive = item.classList.contains('active');
            
            faqItems.forEach(otherItem => {
                otherItem.classList.remove('active');
                otherItem.nextElementSibling.style.maxHeight = null;
            });

            if (!isActive) {
                item.classList.add('active');
                const answer = item.nextElementSibling;
                answer.style.maxHeight = answer.scrollHeight + "px";
            }
        });
    });

    // Compact Booking Frames � Selection Logic
    const bookingFrames = document.querySelectorAll('.booking-frame');
    const serviceSelect = document.getElementById('booking-service');
    const serviceBanner = document.getElementById('selected-service-banner');
    const serviceLabel = document.getElementById('selected-service-label');
    const changeServiceBtn = document.getElementById('change-service-btn');

    function selectFrame(frame) {
        // Deselect all
        bookingFrames.forEach(f => {
            f.classList.remove('selected');
            f.setAttribute('aria-checked', 'false');
        });

        // Select this one
        frame.classList.add('selected');
        frame.setAttribute('aria-checked', 'true');

        const serviceValue = frame.dataset.service;
        const labelText = frame.dataset.label;

        // Sync dropdown
        if (serviceSelect) {
            serviceSelect.value = serviceValue;
        }

        // Show banner
        if (serviceBanner && serviceLabel) {
            serviceBanner.style.display = 'flex';
            serviceLabel.textContent = labelText;
        }

        // GSAP bounce animation on selection
        if (typeof gsap !== 'undefined') {
            gsap.fromTo(frame.querySelector('.frame-photo'), 
                { scale: 0.85 }, 
                { scale: 1, duration: 0.5, ease: 'elastic.out(1, 0.4)' }
            );
        }
    }

    bookingFrames.forEach(frame => {
        frame.addEventListener('click', () => selectFrame(frame));
        frame.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                selectFrame(frame);
            }
        });
    });

    // Change service button � scroll back to frames
    if (changeServiceBtn) {
        changeServiceBtn.addEventListener('click', () => {
            bookingFrames.forEach(f => {
                f.classList.remove('selected');
                f.setAttribute('aria-checked', 'false');
            });
            if (serviceBanner) serviceBanner.style.display = 'none';
            if (serviceSelect) serviceSelect.value = '';

            const framesGrid = document.querySelector('.booking-frames-grid');
            if (framesGrid) {
                framesGrid.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        });
    }

    // Booking Form WhatsApp Integration
    const bookingForm = document.querySelector('.booking-form');
    if (bookingForm) {
        bookingForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            const inputs = bookingForm.querySelectorAll('input');
            const select = bookingForm.querySelector('select');
            
            const name = inputs[0].value;
            const phone = inputs[1].value;
            const service = select.options[select.selectedIndex].text;
            const date = inputs[2].value;
            const time = inputs[3].value;

            const whatsappNumber = "918949853554"; 
            
            const message = `Hello Mumbai Hair Salon! I'd like to book a session at your Mumbai Hair Salon:%0A%0A*Name:* ${name}%0A*Phone:* ${phone}%0A*Service:* ${service}%0A*Date:* ${date}%0A*Time:* ${time}`;
            
            window.open(`https://wa.me/${whatsappNumber}?text=${message}`, '_blank');
            
            bookingForm.reset();
            bookingFrames.forEach(f => {
                f.classList.remove('selected');
                f.setAttribute('aria-checked', 'false');
            });
            if (serviceBanner) serviceBanner.style.display = 'none';
            alert('Redirecting to WhatsApp to book your Mumbai Hair Salon session!');
        });
    }

    // 3. Dynamic 3D Tilt Effect
    const tiltElements = document.querySelectorAll('.glass-card, .hero-img-frame, .service-card, .visual-card');
    
    tiltElements.forEach(el => {
        el.addEventListener('mousemove', (e) => {
            const rect = el.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            const centerX = rect.width / 2;
            const centerY = rect.height / 2;
            
            const rotateX = (y - centerY) / 10;
            const rotateY = (centerX - x) / 10;
            
            gsap.to(el, {
                rotateX: rotateX,
                rotateY: rotateY,
                transformPerspective: 1000,
                duration: 0.5,
                ease: "power2.out"
            });
        });
        
        el.addEventListener('mouseleave', () => {
            gsap.to(el, {
                rotateX: 0,
                rotateY: 0,
                duration: 0.8,
                ease: "elastic.out(1, 0.3)"
            });
        });
    });

    // 4. GSAP Animations
    gsap.registerPlugin(ScrollTrigger);

    // Hero Entry Animation
    const heroTitle = document.querySelector(".hero-title");
    if (heroTitle) {
        const text = heroTitle.textContent;
        heroTitle.innerHTML = text.split("").map(char => `<span class="char" style="display:inline-block">${char === " " ? "&nbsp;" : char}</span>`).join("");
    }

    const tl = gsap.timeline();
    tl.from(".char", {
        y: 100,
        rotateX: -90,
        rotateY: 45,
        z: -200,
        opacity: 0,
        duration: 1,
        stagger: 0.02,
        ease: "back.out(1.7)"
    })
    .from(".hero-subtitle", {
        y: 40,
        opacity: 0,
        duration: 1,
        ease: "power3.out"
    }, "-=0.5")
    .from(".hero-buttons", {
        y: 30,
        opacity: 0,
        duration: 0.8,
        ease: "power3.out"
    }, "-=0.8")
    .from(".hero-img-frame", {
        rotateY: 45,
        rotateX: -10,
        scale: 0.8,
        z: -500,
        opacity: 0,
        duration: 2,
        ease: "expo.out"
    }, "-=1.5");

    // Scroll Reveal for Sections with 3D entry
    const revealElements = document.querySelectorAll('.reveal');
    revealElements.forEach((el) => {
        gsap.fromTo(el, 
            { 
                y: 100, 
                rotateX: -15,
                z: -50,
                opacity: 0 
            },
            {
                y: 0,
                rotateX: 0,
                z: 0,
                opacity: 1,
                duration: 1.2,
                ease: "power3.out",
                scrollTrigger: {
                    trigger: el,
                    start: "top 95%",
                    toggleActions: "play none none none" 
                }
            }
        );
    });

    window.addEventListener('load', () => {
        ScrollTrigger.refresh();
    });

    // 3D Parallax for hero photo
    gsap.to(".hero-photo", {
        y: -50,
        z: 50,
        scale: 1.1,
        ease: "none",
        scrollTrigger: {
            trigger: ".hero",
            start: "top top",
            end: "bottom top",
            scrub: true
        }
    });

    // Floating animation for decorative elements (if any) or just subtle hero float
    gsap.to(".hero-img-frame", {
        y: -20,
        duration: 2.5,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut"
    });

    // Gallery Filtering Logic
    const filterBtns = document.querySelectorAll('.filter-btn');
    const galleryItems = document.querySelectorAll('.gallery-item');

    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            const filterValue = btn.getAttribute('data-filter');

            galleryItems.forEach(item => {
                const category = item.getAttribute('data-category');
                
                if (filterValue === 'all' || filterValue === category) {
                    item.style.display = 'block';
                    gsap.fromTo(item, 
                        { scale: 0.8, rotateY: 30, opacity: 0 }, 
                        { scale: 1, rotateY: 0, opacity: 1, duration: 0.6, ease: "back.out(1.7)" }
                    );
                } else {
                    item.style.display = 'none';
                }
            });

            ScrollTrigger.refresh();
        });
    });


    // 5. 3D Floating Orbs Parallax
    document.addEventListener('mousemove', (e) => {
        const mouseX = e.clientX;
        const mouseY = e.clientY;
        
        gsap.to(".orb-1", {
            x: (mouseX - window.innerWidth / 2) * 0.05,
            y: (mouseY - window.innerHeight / 2) * 0.05,
            duration: 2,
            ease: "power2.out"
        });
        
        gsap.to(".orb-2", {
            x: (mouseX - window.innerWidth / 2) * -0.03,
            y: (mouseY - window.innerHeight / 2) * -0.03,
            duration: 2.5,
            ease: "power2.out"
        });
        
        gsap.to(".orb-3", {
            x: (mouseX - window.innerWidth / 2) * 0.02,
            y: (mouseY - window.innerHeight / 2) * 0.02,
            duration: 3,
            ease: "power2.out"
        });
    });

    // 6. 3D Custom Cursor (Optional but Premium)
    const cursor = document.createElement('div');
    cursor.className = 'cursor-3d';
    document.body.appendChild(cursor);
    
    document.addEventListener('mousemove', (e) => {
        gsap.to(cursor, {
            x: e.clientX,
            y: e.clientY,
            duration: 0.1,
            ease: "power2.out"
        });
    });

    // Cursor hover effects
    const interactiveElements = document.querySelectorAll('a, button, .glass-card, .gallery-item');
    interactiveElements.forEach(el => {
        el.addEventListener('mouseenter', () => cursor.classList.add('active'));
        el.addEventListener('mouseleave', () => cursor.classList.remove('active'));
    });

    // 7. 3D Rainfall Effect
    const canvas = document.createElement('canvas');
    canvas.id = 'rainCanvas';
    document.body.appendChild(canvas);
    Object.assign(canvas.style, {
        position: 'fixed',
        top: '0',
        left: '0',
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: '1',
        opacity: '0.4'
    });

    const ctx = canvas.getContext('2d');
    let width, height;
    let particles = [];

    function resize() {
        width = canvas.width = window.innerWidth;
        height = canvas.height = window.innerHeight;
    }

    window.addEventListener('resize', resize);
    resize();

    class Particle {
        constructor() { this.reset(); }
        reset() {
            this.x = Math.random() * width;
            this.y = Math.random() * -height;
            this.z = Math.random() * 20; 
            this.len = Math.random() * 15 + 10;
            this.speed = Math.random() * 8 + 4 + (this.z * 0.4);
            this.opacity = (this.z / 20) * 0.4;
        }
        draw() {
            ctx.beginPath();
            ctx.strokeStyle = `rgba(142, 142, 142, ${this.opacity})`;
            ctx.lineWidth = 1;
            ctx.moveTo(this.x, this.y);
            ctx.lineTo(this.x, this.y + this.len);
            ctx.stroke();
        }
        update() {
            this.y += this.speed;
            if (this.y > height) this.reset();
        }
    }

    for (let i = 0; i < 150; i++) particles.push(new Particle());

    function animateRain() {
        ctx.clearRect(0, 0, width, height);
        particles.forEach(p => {
            p.update();
            p.draw();
        });
        requestAnimationFrame(animateRain);
    }
    animateRain();
});
