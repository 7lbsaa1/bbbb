/**
 * ضغط واختزال أبعاد الصور وتحويلها إلى نص Base64
 * @param {File} file - ملف الصورة المرفوع
 * @param {number} maxWidth - الأبعاد المسموحة (مثال: 1920px)
 * @param {number} maxHeight - الارتفاع المسموح (مثال: 1920px)
 * @param {number} quality - الجودة الضغطية (0.75 إلى 0.85)
 * @returns {Promise<string>} Base64 Data URL
 */
export function compressAndConvertToBase64(file, maxWidth = 1920, maxHeight = 1920, quality = 0.8) {
  return new Promise((resolve, reject) => {
    if (!file.type.match(/image.*/)) {
      reject(new Error("الملف المحدد ليس صورة صالحة."));
      return;
    }

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        // حساب النسبة والتناسب للـ Resize
        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, width, height);

        // التصدير إلى صيغة Base64 بتصميم WebP أو JPEG للحصول على أقل حجم
        const compressedBase64 = canvas.toDataURL("image/jpeg", quality);
        resolve(compressedBase64);
      };
      img.onerror = (error) => reject(error);
    };
    reader.onerror = (error) => reject(error);
  });
}
