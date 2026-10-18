import { useEffect, useRef, useState } from 'react';
// Live WebGL Earth (three.js, lazy). Textures: NASA Blue Marble (day) + Black Marble 2016 (night lights), public domain.
export default function Earth() {
  const ref = useRef<HTMLDivElement>(null); const [on, setOn] = useState(false);
  useEffect(() => {
    const el = ref.current!; const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches; if (reduce || (navigator as any).connection?.saveData) return;
    const c = document.createElement('canvas'); const gl = c.getContext('webgl2') || c.getContext('webgl'); if (!gl) return;
    let dead = false, raf = 0, cleanup = () => {};
    const start = async () => {
      const T = await import('three'); if (dead) return;
      const W = () => el.clientWidth, H = () => el.clientHeight;
      const renderer = new T.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance', preserveDrawingBuffer: true });
      const mobile = innerWidth < 768; renderer.setPixelRatio(Math.min(devicePixelRatio, mobile ? 1.25 : 1.75)); renderer.setSize(W(), H()); el.appendChild(renderer.domElement);
      renderer.domElement.setAttribute('aria-hidden', 'true');
      const scene = new T.Scene(); const cam = new T.PerspectiveCamera(32, W() / H(), 0.1, 100); cam.position.set(0, 0, 6);
      const tl = new T.TextureLoader(); const [day, night] = await Promise.all(['/earth/day.webp', '/earth/night.webp'].map(u => tl.loadAsync(u)));
      if (dead) return; day.colorSpace = T.SRGBColorSpace; night.colorSpace = T.SRGBColorSpace; day.anisotropy = night.anisotropy = 4;
      const sun = new T.Vector3(-0.35, 0.55, -0.75).normalize();
      const R = 4.2; const earthY = -R - 1.05;
      const earth = new T.Mesh(new T.SphereGeometry(R, mobile ? 72 : 128, mobile ? 72 : 128), new T.ShaderMaterial({
        uniforms: { day: { value: day }, night: { value: night }, sun: { value: sun } },
        vertexShader: `varying vec2 vUv; varying vec3 vN; varying vec3 vV; void main(){ vUv=uv; vN=normalize(mat3(modelMatrix)*normal); vec4 w=modelMatrix*vec4(position,1.); vV=normalize(cameraPosition-w.xyz); gl_Position=projectionMatrix*viewMatrix*w; }`,
        fragmentShader: `uniform sampler2D day; uniform sampler2D night; uniform vec3 sun; varying vec2 vUv; varying vec3 vN; varying vec3 vV;
          void main(){ float d=dot(vN,sun); float k=smoothstep(-0.18,0.28,d);
            vec3 dc=texture2D(day,vUv).rgb; dc=pow(dc,vec3(1.15))*vec3(1.0,1.0,0.97)*1.05;
            vec3 nc=texture2D(night,vUv).rgb; float l=dot(nc,vec3(.299,.587,.114)); vec3 lights=vec3(1.0,.70,.25)*pow(l,1.1)*10.0;
            vec3 col=mix(lights+dc*0.025,dc*(0.25+0.95*max(d,0.)),k);
            float f=pow(1.-max(dot(vN,vV),0.),3.); col+=vec3(.55,.75,1.)*f*(0.12+0.8*k);
            gl_FragColor=vec4(col,1.); }`,
      }));
      earth.position.y = earthY; earth.rotation.set(1.0, 2.9, 0.08); scene.add(earth);
      const atmo = new T.Mesh(new T.SphereGeometry(R * 1.13, 96, 96), new T.ShaderMaterial({
        uniforms: { sun: { value: sun } }, side: T.BackSide, blending: T.CustomBlending, blendSrc: T.OneFactor, blendDst: T.OneMinusSrcAlphaFactor, transparent: true, depthWrite: false,
        vertexShader: `varying vec3 vN; varying vec3 vP; void main(){ vN=normalize(mat3(modelMatrix)*normal); vec4 w=modelMatrix*vec4(position,1.); vP=w.xyz; gl_Position=projectionMatrix*viewMatrix*w; }`,
        fragmentShader: `uniform vec3 sun; varying vec3 vN; varying vec3 vP; void main(){ vec3 v=normalize(cameraPosition-vP); float rim=clamp(dot(-vN,v),0.,1.); float q=clamp(rim/0.47,0.,1.); float f=pow(q,2.6)*1.25+pow(q,14.)*1.6; float s=0.35+0.9*max(dot(vN,sun)+0.4,0.); vec3 c=mix(vec3(.22,.45,1.),vec3(.92,.96,1.),pow(q,9.)); float a=clamp(f*s,0.,1.); gl_FragColor=vec4(c*a,a); }`,
      })); atmo.position.copy(earth.position); scene.add(atmo);
      const N = 1600, pos = new Float32Array(N * 3), seed = new Float32Array(N);
      for (let i = 0; i < N; i++) { pos[i * 3] = (Math.random() - .5) * 40; pos[i * 3 + 1] = (Math.random() - .3) * 24; pos[i * 3 + 2] = -12 - Math.random() * 8; seed[i] = Math.random() * 6.28; }
      const sg = new T.BufferGeometry(); sg.setAttribute('position', new T.BufferAttribute(pos, 3)); sg.setAttribute('seed', new T.BufferAttribute(seed, 1));
      const stars = new T.Points(sg, new T.ShaderMaterial({ uniforms: { t: { value: 0 } }, transparent: true, depthWrite: false,
        vertexShader: `attribute float seed; uniform float t; varying float a; void main(){ a=0.35+0.65*abs(sin(t*0.8+seed*3.)); vec4 mv=modelViewMatrix*vec4(position,1.); gl_PointSize=(1.2+fract(seed*7.)*1.8); gl_Position=projectionMatrix*mv; }`,
        fragmentShader: `varying float a; void main(){ vec2 p=gl_PointCoord-.5; float d=1.-smoothstep(0.,.5,length(p)); gl_FragColor=vec4(vec3(1.,.97,.9),d*a); }` }));
      scene.add(stars);
      let mx = 0, my = 0, tx = 0, ty = 0, drag = false, lx = 0, spin = 0;
      const pm = (e: PointerEvent) => { const r = el.getBoundingClientRect(); tx = ((e.clientX - r.left) / r.width - .5); ty = ((e.clientY - r.top) / r.height - .5); if (drag) { spin += (e.clientX - lx) * 0.004; lx = e.clientX; } };
      const pd = (e: PointerEvent) => { drag = true; lx = e.clientX; }; const pu = () => { drag = false; };
      el.addEventListener('pointermove', pm); el.addEventListener('pointerdown', pd); addEventListener('pointerup', pu);
      const rs = () => { renderer.setSize(W(), H()); cam.aspect = W() / H(); cam.updateProjectionMatrix(); }; addEventListener('resize', rs);
      const clock = new T.Clock(); let visible = true;
      const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; }); io.observe(el);
      const loop = () => { raf = requestAnimationFrame(loop); if (!visible) return; const t = clock.getElapsedTime();
        mx += (tx - mx) * .05; my += (ty - my) * .05; const sp = Math.min(1, scrollY / innerHeight);
        earth.rotation.z = 0.08; earth.rotation.y = 2.9 + (reduce ? 0 : t * 0.018) + spin; (stars.material as any).uniforms.t.value = t;
        cam.position.x = mx * 0.5; cam.position.y = -my * 0.3 - sp * 0.9; cam.position.z = 6 - sp * 0.8; cam.lookAt(0, -0.35 - sp * 0.6, 0);
        stars.position.x = -mx * 0.6; renderer.render(scene, cam); };
      loop(); setOn(true);
      cleanup = () => { io.disconnect(); removeEventListener('resize', rs); removeEventListener('pointerup', pu); renderer.dispose(); };
    };
    // Desktop: boot on idle. Phones/tablets: the poster (a frame rendered by this same shader) stays until the
    // first touch/scroll, so the WebGL cost never lands on initial load or battery for passive visitors.
    const idle = (window as any).requestIdleCallback || ((f: any) => setTimeout(f, 200));
    const desktop = matchMedia('(pointer:fine) and (min-width: 1024px)').matches;
    const evs = ['pointerdown', 'touchstart', 'scroll', 'keydown', 'pointermove'];
    const go = () => { evs.forEach(e => removeEventListener(e, go)); idle(() => start(), { timeout: 800 }); };
    if (desktop) idle(() => start(), { timeout: 1500 }); else evs.forEach(e => addEventListener(e, go, { passive: true, once: true }));
    return () => { dead = true; cancelAnimationFrame(raf); cleanup(); ['pointerdown', 'touchstart', 'scroll', 'keydown', 'pointermove'].forEach(e => removeEventListener(e, go)); };
  }, []);
  return <div ref={ref} className="absolute inset-0" style={{ opacity: on ? 1 : 0, transition: 'opacity 1.4s ease', cursor: 'grab' }} />;
}
