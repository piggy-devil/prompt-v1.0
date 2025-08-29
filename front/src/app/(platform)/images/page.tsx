"use client";

import { useState } from "react";
import ImageUpload from "@/components/images/image-upload";
import ImageGallery from "@/components/images/image-gallery";

const ImagePage = () => {
  const [refreshKey, setRefreshKey] = useState(0);

  const handleUploadSuccess = () => {
    setRefreshKey((prev) => prev + 1);
  };

  return (
    <div className="container mx-auto p-8 space-y-4">
      <ImageUpload onUploadSuccess={handleUploadSuccess} />
      <ImageGallery refresh={refreshKey} />
      <input
        type="file"
        multiple
        onChange={async (e) => {
          const fd = new FormData();
          for (const f of Array.from(e.target.files ?? []))
            fd.append("files", f);
          //   fd.append("category", currentCategory);
          // (ถ้าต้องการ) ใส่ title/description ตาม index
          // fd.append("titles[]", "รูป 1"); fd.append("descriptions[]", "คำอธิบาย 1"); ...
          const res = await fetch("/api/upload/bulk", {
            method: "POST",
            body: fd,
          });
          // รีเฟรชรายการรูป
        }}
      />
    </div>
  );
};

export default ImagePage;
