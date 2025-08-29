"use client";

import Image from "next/image";
import { createAuthClient } from "better-auth/client";
import { useCallback, useEffect, useMemo, useState } from "react";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
import { ImagePreviewButton } from "./image-preview-button";

const authClient = createAuthClient();

type ImageItem = {
  id: string;
  title: string;
  description?: string;
  driveUrl: string;
  createdAt: string;
  userId?: string; // ต้องมีจาก API เพื่อเช็คสิทธิ์
};

export default function ImageGallery({ refresh }: { refresh: number }) {
  const [images, setImages] = useState<ImageItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [me, setMe] = useState<{ id: string } | null>(null);

  // ----- Multi-select state -----
  const [selectMode, setSelectMode] = useState(false);
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const selectedIds = useMemo(
    () => Object.keys(selected).filter((k) => selected[k]),
    [selected]
  );
  const [confirmBulkOpen, setConfirmBulkOpen] = useState(false);

  // ----- Session (client) -----
  useEffect(() => {
    (async () => {
      const res = await authClient.getSession();
      if ("data" in res) {
        setMe(res.data?.user ? { id: res.data.user.id } : null);
      } else {
        setMe(null);
      }
    })();
  }, []);

  // ----- Fetch images -----
  const fetchImages = async () => {
    try {
      const res = await fetch("/api/images", { cache: "no-store" });
      if (res.ok) {
        const data: ImageItem[] = await res.json();
        setImages(data);
        // reset selections on refetch
        setSelected({});
      }
    } catch (e) {
      console.error("Failed to fetch images:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchImages();
  }, [refresh]);

  // ----- Single delete (เดิมคงไว้) -----
  const handleDelete = async (id: string) => {
    if (!confirm("ลบรูปนี้ใช่ไหม?")) return;
    const res = await fetch(`/api/images/${id}`, { method: "DELETE" });
    if (res.ok) {
      setImages((prev) => prev.filter((x) => x.id !== id));
      setSelected((s) => {
        const n = { ...s };
        delete n[id];
        return n;
      });
    } else {
      alert("ลบไม่สำเร็จ");
    }
  };

  // ----- Bulk delete -----
  const handleBulkDelete = async () => {
    setConfirmBulkOpen(false);
    if (selectedIds.length === 0) return;

    const res = await fetch("/api/images/batch-delete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: selectedIds }),
    });

    if (!res.ok) {
      alert("ลบหลายไฟล์ไม่สำเร็จ");
      return;
    }

    const { results } = await res.json();
    // กรองรูปที่ถูกลบออก
    const deletedIds: string[] = results
      .filter((r: any) => r.status === "deleted")
      .map((r: any) => r.id);

    setImages((prev) => prev.filter((img) => !deletedIds.includes(img.id)));
    setSelected({});
    setSelectMode(false);
  };

  // ----- Selection helpers -----
  const toggleSelected = (id: string, checked: boolean) =>
    setSelected((s) => ({ ...s, [id]: checked }));

  const meId = me?.id ?? null;

  const isOwner = useCallback((img: ImageItem) => img.userId === meId, [meId]);

  const ownerImagesOnPage = useMemo(
    () => images.filter((img) => isOwner(img)),
    [images, isOwner]
  );

  const allSelectedOwner = useMemo(
    () => ownerImagesOnPage.every((img) => selected[img.id]),
    [ownerImagesOnPage, selected]
  );

  const someSelectedOwner = useMemo(
    () =>
      ownerImagesOnPage.some((img) => selected[img.id]) && !allSelectedOwner,
    [ownerImagesOnPage, selected, allSelectedOwner]
  );

  const handleToggleSelectAll = (checked: boolean) => {
    setSelected((prev) => {
      const next = { ...prev };
      for (const img of ownerImagesOnPage) next[img.id] = checked;
      return next;
    });
  };

  if (loading) return <div>กำลังโหลดรูปภาพ...</div>;

  return (
    <div className="space-y-3">
      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {me?.id && (
            <Button
              variant={selectMode ? "secondary" : "default"}
              size="sm"
              onClick={() => {
                setSelectMode((v) => !v);
                if (selectMode) setSelected({});
              }}
            >
              {selectMode ? "ยกเลิกโหมดเลือกหลายรูป" : "เลือกหลายรูป"}
            </Button>
          )}

          {selectMode && me?.id && ownerImagesOnPage.length > 0 && (
            <div className="flex items-center gap-2">
              <Checkbox
                checked={allSelectedOwner}
                onCheckedChange={(v) => handleToggleSelectAll(Boolean(v))}
                className={
                  someSelectedOwner
                    ? "data-[state=indeterminate]:opacity-100"
                    : ""
                }
              />
              <span className="text-sm text-muted-foreground">
                เลือกทั้งหมด (เฉพาะรูปของคุณบนหน้านี้)
              </span>
            </div>
          )}
        </div>

        {selectMode && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">
              เลือกแล้ว {selectedIds.length} รูป
            </span>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setConfirmBulkOpen(true)}
              disabled={selectedIds.length === 0}
            >
              ลบที่เลือก
            </Button>
          </div>
        )}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {images.map((image) => {
          const owner = isOwner(image);
          const checked = !!selected[image.id];

          return (
            <Card key={image.id} className="p-3">
              <div className="relative w-full aspect-[4/3] overflow-hidden rounded-lg bg-muted">
                {/* รูปภาพ */}
                <Image
                  src={image.driveUrl}
                  alt={image.title}
                  fill
                  sizes="(max-width: 768px) 100vw, 33vw"
                  className="object-cover"
                  priority
                />

                {/* Checkbox มุมซ้ายบน: แสดงเฉพาะเจ้าของ + เมื่ออยู่ในโหมดเลือกหลายรูป */}
                {selectMode && owner && (
                  <div className="absolute top-2 left-2 bg-background/70 rounded-md p-1">
                    <Checkbox
                      checked={checked}
                      onCheckedChange={(v) =>
                        toggleSelected(image.id, Boolean(v))
                      }
                    />
                  </div>
                )}
              </div>

              <div className="mt-3">
                <h3 className="font-semibold">{image.title}</h3>
                {image.description && (
                  <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                    {image.description}
                  </p>
                )}
                <p className="text-xs text-muted-foreground mt-2">
                  {new Date(image.createdAt).toLocaleDateString()}
                </p>

                <div className="mt-3 flex items-center gap-2">
                  {/* ปุ่มเปิดรูป (lightbox) สามารถใช้ ImagePreviewButton แทนได้ถ้าคุณมี */}
                  <ImagePreviewButton
                    src={image.driveUrl}
                    title={image.title}
                    subtitle={new Date(image.createdAt).toLocaleDateString()}
                    // openInDriveUrl={image.driveUrl} // ถ้าต้องการให้เปิดไปที่ drive
                  />

                  {/* เจ้าของ: แก้ไข/ลบเดี่ยว */}
                  {owner && (
                    <>
                      <Button
                        size="sm"
                        onClick={() => {
                          const newTitle =
                            prompt("แก้ไขชื่อรูปภาพ", image.title) ??
                            image.title;
                          const newDesc =
                            prompt("แก้ไขคำอธิบาย", image.description ?? "") ??
                            image.description;

                          fetch(`/api/images/${image.id}`, {
                            method: "PATCH",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                              title: newTitle,
                              description: newDesc,
                            }),
                          })
                            .then(async (r) => {
                              if (!r.ok) throw new Error("Update failed");
                              const updated = await r.json();
                              setImages((prev) =>
                                prev.map((x) =>
                                  x.id === image.id ? { ...x, ...updated } : x
                                )
                              );
                            })
                            .catch(() => alert("แก้ไขไม่สำเร็จ"));
                        }}
                      >
                        แก้ไข
                      </Button>

                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDelete(image.id)}
                      >
                        ลบ
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Confirm bulk dialog */}
      <AlertDialog open={confirmBulkOpen} onOpenChange={setConfirmBulkOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>ลบรูปที่เลือกทั้งหมด?</AlertDialogTitle>
            <AlertDialogDescription>
              การลบนี้จะลบรูปจาก Google Drive และฐานข้อมูลของคุณ
              ไม่สามารถกู้คืนได้
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>ยกเลิก</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleBulkDelete}
            >
              ยืนยันลบ ({selectedIds.length})
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
