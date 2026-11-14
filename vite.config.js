import { defineConfig } from "vite";
import { resolve } from "path";

export default defineConfig({
  server: {
    port: 5174,
    host: true, // phone / LAN access: http://<PC-IP>:5174
    open: true,
  },
  preview: {
    port: 5174,
    host: true,
  },
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, "index.html"),
        products: resolve(__dirname, "products.html"),
        product: resolve(__dirname, "product.html"),
        blog: resolve(__dirname, "blog.html"),
        contact: resolve(__dirname, "contact.html"),
        odanda: resolve(__dirname, "odanda-gor.html"),
      },
    },
  },
});
