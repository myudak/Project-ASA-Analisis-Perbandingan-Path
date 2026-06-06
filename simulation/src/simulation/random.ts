const N = 624;
const M = 397;
const MATRIX_A = 0x9908b0df;
const UPPER_MASK = 0x80000000;
const LOWER_MASK = 0x7fffffff;

export class PythonRandom {
  private mt = new Uint32Array(N);
  private mti = N + 1;

  constructor(seed: number) {
    this.initByArray(this.seedToKey(seed));
  }

  random(): number {
    const a = this.genrandInt32() >>> 5;
    const b = this.genrandInt32() >>> 6;
    return (a * 67108864 + b) / 9007199254740992;
  }

  uniform(min: number, max: number): number {
    return min + (max - min) * this.random();
  }

  private seedToKey(seed: number): number[] {
    let value = Math.trunc(Math.abs(seed));
    if (value === 0) {
      return [0];
    }

    const key: number[] = [];
    while (value > 0) {
      key.push(value >>> 0);
      value = Math.floor(value / 0x100000000);
    }
    return key;
  }

  private initGenRand(seed: number): void {
    this.mt[0] = seed >>> 0;
    for (this.mti = 1; this.mti < N; this.mti += 1) {
      const previous = this.mt[this.mti - 1];
      const mixed = previous ^ (previous >>> 30);
      this.mt[this.mti] = (Math.imul(1812433253, mixed) + this.mti) >>> 0;
    }
  }

  private initByArray(initKey: number[]): void {
    this.initGenRand(19650218);

    let i = 1;
    let j = 0;
    let k = Math.max(N, initKey.length);

    for (; k > 0; k -= 1) {
      const previous = this.mt[i - 1];
      const mixed = previous ^ (previous >>> 30);
      this.mt[i] =
        ((this.mt[i] ^ Math.imul(mixed, 1664525)) + initKey[j] + j) >>> 0;
      i += 1;
      j += 1;
      if (i >= N) {
        this.mt[0] = this.mt[N - 1];
        i = 1;
      }
      if (j >= initKey.length) {
        j = 0;
      }
    }

    for (k = N - 1; k > 0; k -= 1) {
      const previous = this.mt[i - 1];
      const mixed = previous ^ (previous >>> 30);
      this.mt[i] = ((this.mt[i] ^ Math.imul(mixed, 1566083941)) - i) >>> 0;
      i += 1;
      if (i >= N) {
        this.mt[0] = this.mt[N - 1];
        i = 1;
      }
    }

    this.mt[0] = UPPER_MASK;
  }

  private genrandInt32(): number {
    let y: number;
    const mag01 = [0, MATRIX_A] as const;

    if (this.mti >= N) {
      let kk = 0;

      for (; kk < N - M; kk += 1) {
        y = (this.mt[kk] & UPPER_MASK) | (this.mt[kk + 1] & LOWER_MASK);
        this.mt[kk] = (this.mt[kk + M] ^ (y >>> 1) ^ mag01[y & 1]) >>> 0;
      }

      for (; kk < N - 1; kk += 1) {
        y = (this.mt[kk] & UPPER_MASK) | (this.mt[kk + 1] & LOWER_MASK);
        this.mt[kk] =
          (this.mt[kk + (M - N)] ^ (y >>> 1) ^ mag01[y & 1]) >>> 0;
      }

      y = (this.mt[N - 1] & UPPER_MASK) | (this.mt[0] & LOWER_MASK);
      this.mt[N - 1] = (this.mt[M - 1] ^ (y >>> 1) ^ mag01[y & 1]) >>> 0;
      this.mti = 0;
    }

    y = this.mt[this.mti];
    this.mti += 1;

    y ^= y >>> 11;
    y ^= (y << 7) & 0x9d2c5680;
    y ^= (y << 15) & 0xefc60000;
    y ^= y >>> 18;

    return y >>> 0;
  }
}
