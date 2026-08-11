import Counter from "../models/Counter.js";

/**
 * Generates a unique, zero-padded sequential username based on role.
 * Format: st0001, th0001, ad0001
 */
export const generateUsername = async (role) => {
  const prefixMap = {
    student: "st",
    teacher: "th",
    admin: "ad"
  };

  const prefix = prefixMap[role] || "un";
  const counterName = `${role}_counter`;

  const counter = await Counter.findOneAndUpdate(
    { name: counterName },
    { $inc: { value: 1 } },
    { new: true, upsert: true }
  );

  const paddedNumber = String(counter.value).padStart(4, "0");
  return `${prefix}${paddedNumber}`;
};
