/* ===========================================================
   IKAGENG INTRO ENGINE
   Part 1
=========================================================== */

gsap.registerPlugin();

/*----------------------------------------------------------
ELEMENTS
----------------------------------------------------------*/

const intro = document.querySelector("#intro");

const sun = document.querySelector("#sun");
const glow = document.querySelector("#sunGlow");
const sky = document.querySelector("#sky");

const clouds = document.querySelectorAll(".cloud");

const slides = document.querySelectorAll(".slide");

const finalScreen = document.querySelector("#finalScreen");

const logoObject = document.querySelector("#logoSVG");

const particlesContainer = document.querySelector("#particles");

const skipBtn = document.querySelector("#skipIntro");

/*----------------------------------------------------------
CONFIG
----------------------------------------------------------*/

const INTRO_DURATION = 22;

let logoSVG = null;

/*----------------------------------------------------------
CREATE PARTICLES
----------------------------------------------------------*/

function createParticles(total = 80){

    for(let i=0;i<total;i++){

        const p = document.createElement("span");

        p.className = "particle";

        p.style.left = Math.random()*100+"%";

        p.style.bottom = (-10-Math.random()*300)+"px";

        p.style.animationDelay = Math.random()*8+"s";

        p.style.animationDuration = (6+Math.random()*8)+"s";

        p.style.opacity = .15+Math.random()*.7;

        p.style.transform =
            `scale(${0.4+Math.random()*1.2})`;

        particlesContainer.appendChild(p);

    }

}

/*----------------------------------------------------------
CLOUDS
----------------------------------------------------------*/

function animateClouds(){

    clouds.forEach((cloud,index)=>{

        gsap.set(cloud,{
            x:-500-index*150
        });

        gsap.to(cloud,{
            x:window.innerWidth+600,
            duration:70+(index*20),
            ease:"none",
            repeat:-1
        });

    });

}

/*----------------------------------------------------------
SUNRISE
----------------------------------------------------------*/

function sunrise(){

    gsap.fromTo(sun,

        {
            y:500,
            scale:.7
        },

        {
            y:0,
            scale:1,
            duration:5,
            ease:"power2.out"
        }

    );

    gsap.fromTo(glow,

        {
            opacity:.1
        },

        {
            opacity:1,
            duration:6
        }

    );

}

/*----------------------------------------------------------
SKY
----------------------------------------------------------*/

function animateSky(){

    gsap.to(sky,{

        backgroundPosition:"50% 100%",

        duration:8,

        ease:"power1.inOut"

    });

}

/*----------------------------------------------------------
WHEN SVG LOADS
----------------------------------------------------------*/

logoObject.addEventListener("load",()=>{

    logoSVG = logoObject.contentDocument;

    if(!logoSVG) return;

    const logo = logoSVG.querySelector("#logo");

    const rays = logoSVG.querySelector("#rays");

    const sunLogo = logoSVG.querySelector("#sun");

    if(logo){

        gsap.from(logo,{

            opacity:0,

            scale:.5,

            duration:2,

            ease:"back.out(2)"

        });

        gsap.to(logo,{

            y:-8,

            repeat:-1,

            yoyo:true,

            duration:4,

            ease:"sine.inOut"

        });

        gsap.to(logo,{

            scale:1.02,

            repeat:-1,

            yoyo:true,

            duration:3,

            ease:"sine.inOut"

        });

    }

    if(rays){

        gsap.to(rays,{

            rotate:360,

            transformOrigin:"center center",

            repeat:-1,

            duration:120,

            ease:"none"

        });

    }

    if(sunLogo){

        gsap.to(sunLogo,{

            filter:"drop-shadow(0px 0px 20px gold)",

            repeat:-1,

            yoyo:true,

            duration:2

        });

    }

});

/*----------------------------------------------------------
MORNING GLOW
----------------------------------------------------------*/

function morningGlow(){

    gsap.to(glow,{

        scale:1.15,

        opacity:.85,

        repeat:-1,

        yoyo:true,

        duration:3,

        ease:"sine.inOut"

    });

}

/*----------------------------------------------------------
INTRO START
----------------------------------------------------------*/

function startIntro(){

    createParticles();

    animateClouds();

    animateSky();

    sunrise();

    morningGlow();

}

/*----------------------------------------------------------
SKIP BUTTON
----------------------------------------------------------*/

skipBtn.addEventListener("click",()=>{

    gsap.to(intro,{

        opacity:0,

        duration:1,

        onComplete(){

            window.location="officer-login.html";

        }

    });

});

/*----------------------------------------------------------
AUTO START
----------------------------------------------------------*/

window.addEventListener("load",()=>{

    gsap.set(slides,{
        autoAlpha:0,
        y:50
    });

    gsap.set(finalScreen,{
        autoAlpha:0
    });

    startIntro();

});
/*==========================================================
    PRESENTATION TIMELINE
==========================================================*/

const timeline = gsap.timeline({
    delay: 5
});

/* Hide everything */

slides.forEach(slide=>{
    gsap.set(slide,{
        autoAlpha:0,
        scale:.9,
        y:40
    });
});

/*----------------------------
SLIDE ANIMATION
----------------------------*/

function animateSlide(slide){

    timeline

    .to(slide,{
        autoAlpha:1,
        scale:1,
        y:0,
        duration:1,
        ease:"power3.out"
    })

    .from(slide.querySelector(".emoji"),{
        scale:0,
        rotation:-180,
        duration:.8,
        ease:"back.out(2)"
    },"<")

    .from(slide.querySelectorAll("h1,h2"),{

        opacity:0,

        y:30,

        stagger:.15,

        duration:.6

    },"<.2")

    .from(slide.querySelectorAll("li"),{

        opacity:0,

        x:-40,

        stagger:.12,

        duration:.5

    })

    .to({},{
        duration:2
    })

    .to(slide,{

        autoAlpha:0,

        y:-40,

        scale:.96,

        duration:.8

    });

}

/*==========================================================
SLIDES
==========================================================*/

slides.forEach(slide=>{

    animateSlide(slide);

});

/*==========================================================
FINAL SCREEN
==========================================================*/

timeline

.to("#logoScene",{

    scale:1.1,

    duration:2

})

.to("#presentation",{

    autoAlpha:0,

    duration:1

})

.to("#finalScreen",{

    autoAlpha:1,

    duration:1.5

})

.from("#finalScreen h1",{

    y:40,

    opacity:0,

    duration:.8

})

.from("#finalScreen h2",{

    y:20,

    opacity:0,

    duration:.6

},"<.2")

.from("#finalScreen p",{

    opacity:0,

    y:20,

    stagger:.25,

    duration:.5

})

.to("#finalScreen",{

    scale:1.02,

    repeat:1,

    yoyo:true,

    duration:2

})

.to({},{

    duration:2

});

/*==========================================================
LOGO CONTINUOUS LIFE
==========================================================*/

function animateLogoLife(){

    if(!logoSVG) return;

    const logo=logoSVG.querySelector("#logo");

    const rays=logoSVG.querySelector("#rays");

    const sun=logoSVG.querySelector("#sun");

    if(logo){

        gsap.to(logo,{

            rotation:2,

            repeat:-1,

            yoyo:true,

            duration:12,

            ease:"sine.inOut"

        });

    }

    if(rays){

        gsap.to(rays,{

            rotation:"+=360",

            transformOrigin:"center",

            duration:90,

            repeat:-1,

            ease:"none"

        });

    }

    if(sun){

        gsap.timeline({repeat:-1})

        .to(sun,{

            scale:1.08,

            duration:2

        })

        .to(sun,{

            scale:1,

            duration:2

        });

    }

}

setTimeout(animateLogoLife,3000);

/*==========================================================
AUTO REDIRECT
==========================================================*/

timeline.call(()=>{

    gsap.to("#intro",{

        opacity:0,

        duration:1.5,

        onComplete(){

            window.location.href="officer-login.html";

        }

    });

});

/*==========================================================
FIRST VISIT ONLY
==========================================================*/

if(localStorage.getItem("ikagengIntroSeen")){

    window.location.href="officer-login.html";

}

timeline.call(()=>{

    localStorage.setItem("ikagengIntroSeen","true");

});

/*==========================================================
SKIP
==========================================================*/

skipBtn.onclick=()=>{

    timeline.kill();

    gsap.to("#intro",{

        opacity:0,

        duration:.8,

        onComplete(){

            window.location.href="login.html";

        }

    });

};

/*==========================================================
RESPONSIVE
==========================================================*/

window.addEventListener("resize",()=>{

    ScrollTrigger?.refresh?.();

});

/*==========================================================
END
==========================================================*/