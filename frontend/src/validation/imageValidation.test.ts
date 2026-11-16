import { describe, expect, it } from "vitest";
import { maxImageBytes, validateImageFile } from "./imageValidation";

describe("imageValidation", () => {
  it("acepta magic bytes validos JPEG y PNG", async () => {
    const jpegBytes = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10]);
    const jpegFile = new File([jpegBytes.buffer], "tilapia.jpg", { type: "image/jpeg" });
    expect(await validateImageFile(jpegFile)).toBeNull();

    const pngBytes = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
    const pngFile = new File([pngBytes.buffer], "tilapia.png", { type: "image/png" });
    expect(await validateImageFile(pngFile)).toBeNull();
  });

  it("rechaza archivos vacios, que superen 5 MB o sin magic bytes JPG/PNG", async () => {
    const emptyFile = new File([], "empty.jpg", { type: "image/jpeg" });
    expect(await validateImageFile(emptyFile)).toBe("La imagen está vacía");

    const invalidHeader = new Uint8Array([0x47, 0x49, 0x46, 0x38, 0x39, 0x61, 0x01, 0x02]);
    const fakeJpg = new File([invalidHeader.buffer], "fake.jpg", { type: "image/jpeg" });
    expect(await validateImageFile(fakeJpg)).toBe("El archivo no es una imagen JPG o PNG válida");

    const largeBuffer = new Uint8Array(maxImageBytes + 1);
    const largeFile = new File([largeBuffer.buffer], "huge.jpg", { type: "image/jpeg" });
    expect(await validateImageFile(largeFile)).toBe("La imagen supera el tamaño máximo de 5 MB");
  });
});
