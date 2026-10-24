/**
 * Robust RFC 4180 Compliant CSV Parser & Product Import Utility
 * Supports commas inside quotes, escaped quotes (""), newlines in cells,
 * flexible header aliasing, and template generation.
 */

/**
 * Parses raw CSV text into a 2D array of strings.
 * @param {string} text - Raw CSV content
 * @returns {string[][]} Array of row values
 */
export function parseCSVMatrix(text) {
  if (!text || typeof text !== "string") return [];

  const rows = [];
  let currentRow = [];
  let currentCell = "";
  let inQuotes = false;
  let i = 0;
  const len = text.length;

  // Normalize CRLF to LF
  while (i < len) {
    const char = text[i];
    const nextChar = text[i + 1];

    if (inQuotes) {
      if (char === '"') {
        if (nextChar === '"') {
          // Escaped quote: "" -> "
          currentCell += '"';
          i += 2;
          continue;
        } else {
          // Closing quote
          inQuotes = false;
          i++;
          continue;
        }
      } else {
        currentCell += char;
        i++;
        continue;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
        i++;
        continue;
      } else if (char === ",") {
        currentRow.push(currentCell.trim());
        currentCell = "";
        i++;
        continue;
      } else if (char === "\r") {
        if (nextChar === "\n") {
          i += 2;
        } else {
          i++;
        }
        currentRow.push(currentCell.trim());
        if (currentRow.some((c) => c !== "")) {
          rows.push(currentRow);
        }
        currentRow = [];
        currentCell = "";
        continue;
      } else if (char === "\n") {
        currentRow.push(currentCell.trim());
        if (currentRow.some((c) => c !== "")) {
          rows.push(currentRow);
        }
        currentRow = [];
        currentCell = "";
        i++;
        continue;
      } else {
        currentCell += char;
        i++;
        continue;
      }
    }
  }

  // Push final cell/row if present
  if (currentCell !== "" || inQuotes) {
    currentRow.push(currentCell.trim());
  }
  if (currentRow.some((c) => c !== "")) {
    rows.push(currentRow);
  }

  return rows;
}

/**
 * Normalizes header key to standard property name
 */
function normalizeHeaderKey(header) {
  const clean = header.toLowerCase().replace(/[^a-z0-9]/g, "");
  switch (clean) {
    case "title":
    case "producttitle":
    case "name":
    case "productname":
      return "title";
    case "price":
    case "sellingprice":
    case "saleprice":
      return "price";
    case "mrp":
      return "mrp";
    case "originalprice":
    case "listprice":
    case "regularprice":
      return "originalPrice";
    case "category":
    case "cat":
      return "category";
    case "sku":
    case "productsku":
    case "productcode":
    case "itemcode":
      return "sku";
    case "id":
    case "productid":
      return "id";
    case "brand":
      return "brand";
    case "style":
      return "style";
    case "description":
    case "desc":
      return "description";
    case "sizes":
    case "size":
      return "sizes";
    case "colors":
    case "color":
    case "colours":
    case "colour":
      return "colors";
    case "image":
    case "images":
    case "imageurl":
    case "imageurls":
      return "images";
    case "deliverydays":
    case "delivery":
      return "deliveryDays";
    case "moq":
    case "minimumorderquantity":
      return "moq";
    case "unitlabel":
    case "unit":
      return "unitLabel";
    case "pricenote":
      return "priceNote";
    case "features":
      return "features";
    default:
      return header.trim();
  }
}

/**
 * Parses raw CSV into standardized product objects
 * @param {string} text - Raw CSV text
 * @returns {{ products: any[], errors: string[] }}
 */
export function parseCSVToProducts(text) {
  const matrix = parseCSVMatrix(text);
  if (matrix.length === 0) {
    return { products: [], errors: ["CSV file is empty."] };
  }

  const rawHeaders = matrix[0];
  const headers = rawHeaders.map(normalizeHeaderKey);
  const rows = matrix.slice(1);
  const products = [];
  const errors = [];

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const _rowNum = i + 2; // 1-based index including header
    const product = {};

    for (let j = 0; j < headers.length; j++) {
      const key = headers[j];
      const val = row[j] !== undefined ? row[j].trim() : "";
      if (!val) continue;

      if (key === "price" || key === "originalPrice" || key === "mrp") {
        const num = parseFloat(val.replace(/[₹$,]/g, ""));
        if (!isNaN(num)) {
          product[key] = num;
        }
      } else if (key === "id" || key === "moq") {
        const num = parseInt(val, 10);
        if (!isNaN(num)) {
          product[key] = num;
        }
      } else if (key === "sizes") {
        product.sizes = val
          .split(/[,|;]/)
          .map((s) => s.trim())
          .filter(Boolean);
      } else if (key === "colors") {
        product.colors = val
          .split(/[,|;]/)
          .map((c) => c.trim())
          .filter(Boolean);
      } else if (key === "images") {
        product.images = val
          .split(/[,|;]/)
          .map((url) => url.trim())
          .filter(Boolean);
      } else if (key === "features") {
        product.features = val
          .split(/[;\n|]/)
          .map((f) => f.trim())
          .filter(Boolean);
      } else {
        product[key] = val;
      }
    }

    if (Object.keys(product).length > 0) {
      products.push(product);
    }
  }

  return { products, errors };
}

/**
 * Validates and parses JSON content into product array
 * @param {string} text - Raw JSON string
 * @returns {{ products: any[], error: string|null }}
 */
export function parseJSONToProducts(text) {
  try {
    const parsed = JSON.parse(text);
    if (Array.isArray(parsed)) {
      return { products: parsed, error: null };
    }
    if (parsed && typeof parsed === "object" && Array.isArray(parsed.products)) {
      return { products: parsed.products, error: null };
    }
    return {
      products: [],
      error: "JSON must be an array of products or an object containing a 'products' array.",
    };
  } catch (err) {
    return {
      products: [],
      error: `Malformed JSON: ${err.message}`,
    };
  }
}

/**
 * Returns a ready-to-download sample CSV template conforming to backend schema
 */
export function getSampleCSVTemplate() {
  return `sku,title,price,originalPrice,category,brand,style,sizes,colors,description,deliveryDays,moq
PRD-SMP-001,"Premium Pima Cotton Crewneck",799,1299,casual,Giftingwellness,casual,"S, M, L, XL","Black, White, Navy","Luxurious 100% Pima cotton t-shirt with reinforced crew neck.","3–5 Days",1
PRD-SMP-002,"Tailored Stretch Chino Trousers",1499,2499,formal,Giftingwellness,formal,"30, 32, 34, 36","Beige, Navy, Olive","Slim-tapered cotton chinos with 3% elastane for day-long flexibility.","3–5 Days",1
PRD-SMP-003,"Urban Insulated Matte Flask 750ml",549,899,drinkware,Urban Gear,gym,"750ml","Black, #10b981, Silver","Double-wall vacuum insulated stainless steel flask. Keeps cold for 24h.","2–4 Days",5
PRD-SMP-004,"Seamless High-Rise Training Leggings",999,1699,gym,Giftingwellness,gym,"XS, S, M, L","Charcoal, #4f46e5, Slate","High-compression moisture-wicking leggings with 4-way stretch fabric.","3–5 Days",1`;
}

/**
 * Returns a ready-to-download sample JSON template conforming to backend schema
 */
export function getSampleJSONTemplate() {
  return JSON.stringify(
    [
      {
        sku: "PRD-SMP-001",
        title: "Premium Pima Cotton Crewneck",
        price: 799,
        originalPrice: 1299,
        category: "casual",
        brand: "Giftingwellness",
        style: "casual",
        sizes: ["S", "M", "L", "XL"],
        colors: ["Black", "White", "Navy"],
        description: "Luxurious 100% Pima cotton t-shirt with reinforced crew neck.",
        deliveryDays: "3–5 Days",
        moq: 1,
      },
      {
        sku: "PRD-SMP-002",
        title: "Tailored Stretch Chino Trousers",
        price: 1499,
        originalPrice: 2499,
        category: "formal",
        brand: "Giftingwellness",
        style: "formal",
        sizes: ["30", "32", "34", "36"],
        colors: ["Beige", "Navy", "Olive"],
        description: "Slim-tapered cotton chinos with 3% elastane for day-long flexibility.",
        deliveryDays: "3–5 Days",
        moq: 1,
      },
      {
        sku: "PRD-SMP-003",
        title: "Urban Insulated Matte Flask 750ml",
        price: 549,
        originalPrice: 899,
        category: "drinkware",
        brand: "Urban Gear",
        style: "gym",
        sizes: ["750ml"],
        colors: ["Black", "#10b981", "Silver"],
        description: "Double-wall vacuum insulated stainless steel flask. Keeps cold for 24h.",
        deliveryDays: "2–4 Days",
        moq: 5,
      },
    ],
    null,
    2
  );
}

/**
 * Triggers a client-side download of a template file
 */
export function downloadFile(filename, content, mimeType = "text/plain") {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
