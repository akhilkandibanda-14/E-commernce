// Lets any page open the header's bulk-enquiry form without prop drilling.
export const BULK_ENQUIRY_EVENT = "gw:open-bulk-enquiry";

export const openBulkEnquiry = (category = "") => {
  window.dispatchEvent(new CustomEvent(BULK_ENQUIRY_EVENT, { detail: { category } }));
};
