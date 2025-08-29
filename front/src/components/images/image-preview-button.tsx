"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Loader2 } from "lucide-react";
import { Skeleton } from "../ui/skeleton";

type Props = {
  src: string;
  title?: string;
  subtitle?: string;
  openInDriveUrl?: string;
};

export function ImagePreviewButton({
  src,
  title = "รูปภาพ",
  subtitle,
  openInDriveUrl,
}: Props) {
  const [open, setOpen] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [imgLoading, setImgLoading] = useState(true);
  const [imgError, setImgError] = useState<string | null>(null);

  // รีเซ็ต state ทุกครั้งที่เปิด dialog หรือรูปเปลี่ยน
  useEffect(() => {
    if (open) {
      setZoom(1);
      setImgLoading(true);
      setImgError(null);
    }
  }, [open, src]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="secondary" size="sm">
          เปิดรูป
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-[95vw] w-[95vw] h-[90vh] p-0 overflow-hidden">
        <DialogHeader className="px-4 py-3 border-b">
          <div className="flex items-center justify-between gap-2">
            <div>
              <DialogTitle className="text-base">{title}</DialogTitle>
              {subtitle && (
                <DialogDescription className="text-xs">
                  {subtitle}
                </DialogDescription>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Button variant="secondary" size="sm" onClick={() => setZoom(1)}>
                รีเซ็ต
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setZoom((z) => Math.min(4, z + 0.25))}
              >
                ขยาย +
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setZoom((z) => Math.max(1, z - 0.25))}
              >
                ย่อ −
              </Button>
              {!!openInDriveUrl && (
                <Button variant="outline" size="sm" asChild>
                  <a href={openInDriveUrl} target="_blank" rel="noreferrer">
                    เปิดใน Drive
                  </a>
                </Button>
              )}
            </div>
          </div>
        </DialogHeader>

        {/* พื้นที่รูป */}
        <div className="relative h-[calc(90vh-56px)] w-full bg-black/80 overflow-auto">
          {/* Overlay: SKELETON ขณะโหลด */}
          {imgLoading && !imgError && (
            <div className="absolute inset-0 z-10 flex items-center justify-center p-6">
              <div className="w-full h-full max-w-[95vw]">
                <Skeleton className="h-full w-full rounded-lg" />
              </div>
            </div>
          )}

          {/* Overlay: กำลังโหลด */}
          {imgLoading && !imgError && (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3">
              <Loader2 className="h-8 w-8 animate-spin text-white/90" />
              <p className="text-xs text-white/70">กำลังโหลดรูป...</p>
            </div>
          )}

          {/* Overlay: error โหลดรูปไม่สำเร็จ */}
          {imgError && (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3">
              <p className="text-sm text-red-200">โหลดรูปไม่สำเร็จ</p>
              <Button
                size="sm"
                onClick={() => {
                  setImgLoading(true);
                  setImgError(null);
                }}
              >
                ลองใหม่
              </Button>
            </div>
          )}

          <div className="min-h-full min-w-full flex items-center justify-center">
            <Image
              src={src}
              alt={title}
              width={2000}
              height={2000}
              className="object-contain select-none"
              style={{
                transform: `scale(${zoom})`,
                transformOrigin: "center center",
              }}
              priority
              onLoad={() => setImgLoading(false)}
              onError={() => {
                setImgLoading(false);
                setImgError("fail");
              }}
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
