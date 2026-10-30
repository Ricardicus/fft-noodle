function complexAdd(a, b) {
    return {
        re: a.re + b.re,
        im: a.im + b.im
    };
}

function complexSub(a, b) {
    return {
        re: a.re - b.re,
        im: a.im - b.im
    };
}

function complexMul(a, b) {
    return {
        re: a.re * b.re - a.im * b.im,
        im: a.re * b.im + a.im * b.re
    };
}

function odd(x) {
  let o = [];
  for (let j = 1; j < x.length; j+=2) {
    o.push(x[j]);
  }
  return o;
}

function even(x) {
  let e = [];
  for (let j = 0; j<x.length; j+=2) {
    e.push(x[j]);
  }
  return e;
}

function twiddle(k, N) {
    const angle = -2 * Math.PI * k / N;
    return {
        re: Math.cos(angle),
        im: Math.sin(angle)
    };
}

function fft(values) {
  let N = values.length;
  let X = new Array(N);
  
  if (N === 1) return values;
  if (N == 2) {
    X[0] = complexAdd(values[0],values[1]);
    X[1] = complexSub(values[0],values[1]);
    return X;
  }

  let e = even(values);
  let o = odd(values);

  let E = fft(e);
  let O = fft(o);

  for (let k = 0; k < N/2; k++) {
    let w = twiddle(k, N);
    let to = complexMul(w, O[k]);
    X[k] = complexAdd(E[k],to);  
    X[k+N/2] = complexSub(E[k],to);
  }

  return X;
}

function isPowerOfTwo(n) {
    return n > 0 && Number.isInteger(n) && (n & (n - 1)) === 0;
}
function transformR(values) {
  let N = values.length;
  if (!isPowerOfTwo(N)) return null;
  let complexArray = [];
  for (const v of values) {
    complexArray.push({re: v, im: 0.0});
  }
  return fft(complexArray);
}
