const API_BASE_URL = "http://localhost:8801/api/products";

export async function getProducts() {
  const response = await fetch(API_BASE_URL);

  if (!response.ok) {
    throw new Error("Failed to load products");
  }

  return response.json();
}

export async function createProduct(product, image) {
  const formData = new FormData();

  formData.append(
    "product",
    new Blob([JSON.stringify(product)], {
      type: "application/json",
    })
  );

  formData.append("file", image);

  const response = await fetch(API_BASE_URL, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || "Failed to create product");
  }

  return response.json();
}