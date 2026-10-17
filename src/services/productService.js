const API_BASE_URL = "https://suzi-ecom-product.onrender.com/api/products";

export async function getProducts() {
  const response = await fetch(API_BASE_URL);

  if (!response.ok) {
    throw new Error(`Failed to load products (${response.status})`);
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

  if (image) {
    formData.append("file", image);
  }

  const response = await fetch(API_BASE_URL, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    throw new Error(`Failed to create product (${response.status})`);
  }

  return response.json();
}