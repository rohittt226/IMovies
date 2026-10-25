
const PROMO_CODES = {
  IMOVIES10: {
    type: "percentage",
    value: 10,
    maxDiscount: 10000, 
  },

  MOVIE20: {
    type: "percentage",
    value: 20,
    maxDiscount: 15000, 
  },

  FIRST50: {
    type: "fixed",
    value: 5000, 
  },
};


const calculatePromoDiscount = (originalAmount, promoCode) => {
  if (
    !Number.isSafeInteger(originalAmount) ||
    originalAmount <= 0
  ) {
    throw new Error("Invalid original amount");
  }

  
  if (promoCode === undefined || promoCode === null || promoCode === "") {
    return {
      promoCode: null,
      discountAmount: 0,
      finalAmount: originalAmount,
    };
  }

  if (typeof promoCode !== "string") {
    throw new Error("Invalid promo code");
  }

  const normalizedCode = promoCode.trim().toUpperCase();

  if (!normalizedCode) {
    return {
      promoCode: null,
      discountAmount: 0,
      finalAmount: originalAmount,
    };
  }

  const promo = PROMO_CODES[normalizedCode];

  if (!promo) {
    throw new Error("Invalid promo code");
  }

  let discountAmount = 0;

  if (promo.type === "percentage") {
    discountAmount = Math.min(
      Math.round((originalAmount * promo.value) / 100),
      promo.maxDiscount
    );
  } else if (promo.type === "fixed") {
    discountAmount = promo.value;
  }

  
  discountAmount = Math.min(
    discountAmount,
    Math.max(0, originalAmount - 100)
  );

  return {
    promoCode: normalizedCode,
    discountAmount,
    finalAmount: originalAmount - discountAmount,
  };
};

module.exports = {
  calculatePromoDiscount,
};