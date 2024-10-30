// IEEE 754 float16 to float32 conversion
export const convertFloat16ToFloat32 = (float16: number): number => {
  const sign = (float16 >> 15) & 0x1;
  let exponent = (float16 >> 10) & 0x1f;
  let fraction = float16 & 0x3ff;

  if (exponent === 0x1f) { // Infinity or NaN
    exponent = 0xff;
    if (fraction !== 0) {
      fraction <<= 13;
    }
  } else if (exponent === 0) { // Subnormal or zero
    if (fraction !== 0) {
      while ((fraction & 0x400) === 0) {
        fraction <<= 1;
        exponent--;
      }
      fraction &= 0x3ff;
      exponent++;
    }
    exponent += 127 - 15;
  } else {
    exponent += 127 - 15;
  }

  const float32 = (sign << 31) | (exponent << 23) | (fraction << 13);
  const buffer = new ArrayBuffer(4);
  const view = new DataView(buffer);
  view.setInt32(0, float32, false);
  return view.getFloat32(0, false);
};