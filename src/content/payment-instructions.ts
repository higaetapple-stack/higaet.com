/**
 * Payment instructions shown to users on the manual checkout page.
 * Edit these values to match HIGAET's real receiving accounts.
 */
export const PAYMENT_INSTRUCTIONS = {
  upi: {
    id: "higaet@upi",
    name: "HIGAET",
    qrImage: "/payment-qr.png", // place file in public/ or replace with hosted URL
  },
  bank: {
    accountName: "Helen Institute of Gen AI Engineering & Technology",
    accountNumber: "XXXXXXXXXXXX",
    ifsc: "XXXXX0000000",
    bankName: "HDFC Bank",
    branch: "Bengaluru",
  },
  paypal: {
    email: "payments@higaet.com",
  },
  bankWire: {
    accountName: "HIGAET Technologies Pvt Ltd",
    accountNumber: "XXXXXXXXXXXX",
    swift: "HDFCINBB",
    bankName: "HDFC Bank",
    address: "Bengaluru, India",
  },
} as const;

export const PAYMENT_METHODS = [
  { value: "upi", label: "UPI", region: "IN" },
  { value: "google_pay", label: "Google Pay", region: "IN" },
  { value: "phonepe", label: "PhonePe", region: "IN" },
  { value: "paytm", label: "Paytm", region: "IN" },
  { value: "amazon_pay", label: "Amazon Pay UPI", region: "IN" },
  { value: "bank_transfer", label: "Bank Transfer (NEFT/IMPS/RTGS)", region: "IN" },
  { value: "paypal", label: "PayPal", region: "INTL" },
  { value: "bank_wire", label: "Bank Wire", region: "INTL" },
  { value: "other", label: "Other", region: "ANY" },
] as const;

export const PAYMENT_PURPOSES = [
  { value: "course_enrollment", label: "Course enrollment" },
  { value: "program_enrollment", label: "Program enrollment" },
  { value: "consultation", label: "Counseling / Consultation" },
  { value: "invoice", label: "Tech invoice" },
  { value: "proposal", label: "Proposal" },
  { value: "subscription", label: "Subscription" },
  { value: "other", label: "Other" },
] as const;
