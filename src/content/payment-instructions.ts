/**
 * Payment instructions shown to users on the manual checkout page.
 * These are HIGAET's real receiving accounts.
 */
export const PAYMENT_INSTRUCTIONS = {
  upi: {
    ids: ["higaet@ybl", "higaet@ibl", "higaet@axl"] as const,
    name: "HIGAET",
    qrImage: "/payment-qr.png",
  },
  bank: {
    accountName: "Helen Institute of Gen AI Engineering & Technology",
    accountNumber: "39700100002312",
    ifsc: "BARB0NARASA",
    bankName: "Bank of Baroda",
    branch: "Narasaraopet",
  },
  paypal: {
    email: "payments@higaet.com",
  },
  bankWire: {
    accountName: "Helen Institute of Gen AI Engineering & Technology",
    accountNumber: "39700100002312",
    swift: "BARBINBBXXX",
    bankName: "Bank of Baroda",
    address: "Narasaraopet, Andhra Pradesh, India",
  },
} as const;

export const PAYMENT_METHODS = [
  { value: "upi", label: "UPI", region: "IN", icon: "📲" },
  { value: "google_pay", label: "Google Pay", region: "IN", icon: "🟢" },
  { value: "phonepe", label: "PhonePe", region: "IN", icon: "🟣" },
  { value: "paytm", label: "Paytm", region: "IN", icon: "🔵" },
  { value: "amazon_pay", label: "Amazon Pay UPI", region: "IN", icon: "🟠" },
  { value: "bank_transfer", label: "Bank Transfer (NEFT/IMPS/RTGS)", region: "IN", icon: "🏦" },
  { value: "paypal", label: "PayPal", region: "INTL", icon: "💳" },
  { value: "bank_wire", label: "Bank Wire (International)", region: "INTL", icon: "🌐" },
  { value: "other", label: "Other", region: "ANY", icon: "•" },
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

export const PAYMENT_STATUS_FLOW = [
  { key: "pending_verification", label: "Pending Verification" },
  { key: "info_requested", label: "More Information Required" },
  { key: "approved", label: "Approved" },
  { key: "rejected", label: "Rejected" },
] as const;
