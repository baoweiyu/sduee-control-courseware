"use strict";
const IntroModels = (() => {
  const dt = 0.04;
  const steps = 300;
  const duration = steps * dt;
  const clamp = (x, lo = 0, hi = 1) => Math.max(lo, Math.min(hi, x));
  const percent = x => Math.round(100 * x);
  const series = (initial, advance) => {
    let state = initial;
    return Array.from({length: steps + 1}, (_, i) => {
      const time = i * dt;
      const [next, sample] = advance(state, time);
      state = next;
      return {t: time, ...sample};
    });
  };
  const at = (samples, t) => samples[Math.round(clamp(t, 0, duration) / dt)];

  function command({target}) {
    return series(0, (y, t) => {
      const r = t >= 1 ? target : 0;
      return [y + dt * (r - y) / 1.4, {y,r}];
    });
  }
  function thermal({target, door, ambient, thermalLoad}) {
    const baseline = .022 * (target - ambient);
    return series(target, (temperature, t) => {
      const angle = t >= 2 ? door : 0;
      const loss = (.022 + .057 * Math.sin(angle * Math.PI / 180)) * (temperature - ambient)
        + (t >= 2 ? thermalLoad * .052 : 0);
      const power = clamp(baseline + .14 * (target - temperature), 0, 3.1);
      return [temperature + dt * (power - loss), {temperature, target, power, loss, angle, error:target-temperature}];
    });
  }
  function hydraulic({outlet}) {
    return series(.58, (h, t) => {
      const valve = t >= 2 ? outlet / 100 : .35;
      const inlet = clamp(.27 + 1.4 * (.58 - h));
      const qIn = inlet * .33;
      const qOut = valve * .335 * Math.sqrt(h);
      return [clamp(h + dt * (qIn - qOut), .025, .94), {h,inlet,qIn,qOut,valve}];
    });
  }
  function drive({target, load, when, feed = 100}, mode) {
    return series(target, (y,t) => {
      const d = t >= when ? load : 0;
      const error = target - y;
      const returnSignal = mode === "open" ? 0 : 2.2 * error;
      const correction = mode === "compound" ? d * feed / 100 : 0;
      const u = clamp(target+returnSignal+correction,0,220);
      return [y + dt*(u-y-d)/1.65, {y, d, target, error, u, returnSignal, correction}];
    });
  }
  function performance({mode, damping, speed, tracking}) {
    if (mode === 0) {
      function step(t, zeta) {
        const omega = 1.6;
        if(zeta===1)return 1-Math.exp(-omega*t)*(1+omega*t);
        const u=Math.sqrt(Math.abs(1-zeta*zeta));
        if(zeta<1){
          const q=omega*u*t;
          return 1-Math.exp(-zeta*omega*t)*(Math.cos(q)+zeta/u*Math.sin(q));
        }
        const r1=omega*(-zeta+u),r2=omega*(-zeta-u);
        return 1+(r2*Math.exp(r1*t)-r1*Math.exp(r2*t))/(r1-r2);
      }
      return series(null, (_,t) => [null,{y:step(t,damping),r:1,baseline:step(t,.62)}]);
    }
    if (mode === 1) return series(0, (_,t) => [0,{y:1-Math.exp(-t/speed),r:1,baseline:1-Math.exp(-t/3.2)}]);
    return series(0, (y,t) => {
      const r=.25*t;
      return [y+dt*(r-y)*tracking,{y,r,baseline:r-.25*(1-Math.exp(-.62*t))/.62}];
    });
  }
  return {dt,steps,duration,clamp,percent,at,command,thermal,hydraulic,drive,performance};
})();
if (typeof module !== "undefined") module.exports = IntroModels;
