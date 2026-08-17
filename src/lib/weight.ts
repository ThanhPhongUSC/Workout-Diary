/** The unit a lifter typed a weight in. Storage is always kilograms. */
export type WeightUnit = 'kg' | 'lb';

/** Kilograms in one pound, the international avoirdupois definition. */
const KG_PER_LB = 0.45359237;

/** Converts a typed weight into the kilograms stored on the set. */
export function toKg(value: number, unit: WeightUnit) {
  return unit === 'lb' ? value * KG_PER_LB : value;
}

/** Converts stored kilograms back into the unit the lifter typed. */
export function fromKg(kg: number, unit: WeightUnit) {
  return unit === 'lb' ? kg / KG_PER_LB : kg;
}
