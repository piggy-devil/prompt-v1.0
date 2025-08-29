"use client";

import Image from "next/image";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { X, Upload, ImagePlus, Loader2 } from "lucide-react";
import { useCallback, useMemo, useRef, useState, useEffect } from "react";

type FileRow = {
  file: File;
  previewUrl: string;
  title: string;
  description: string;
  progress: number; // 0-100
  status: "queued" | "uploading" | "done" | "error";
  xhr?: XMLHttpRequest;
};

export default function ImageUpload({
  onUploadSuccess,
  defaultCategory = "Uncategorized",
}: {
  onUploadSuccess: () => void;
  defaultCategory?: string;
}) {
  const [caption, setCaption] = useState(""); // ข้อความรวมแนว FB (optional)
  const [category, setCategory] = useState(defaultCategory);
  const [rows, setRows] = useState<FileRow[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const [busy, setBusy] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const captionRef = useRef(caption);

  useEffect(() => {
    captionRef.current = caption;
  }, [caption]);

  // ---- cleanup previews ----
  useEffect(() => {
    return () => {
      rows.forEach((r) => URL.revokeObjectURL(r.previewUrl));
    };
  }, [rows]);

  const hasFiles = rows.length > 0;
  const uploadingCount = rows.filter((r) => r.status === "uploading").length;
  const queuedCount = rows.filter((r) => r.status === "queued").length;
  const doneCount = rows.filter((r) => r.status === "done").length;

  const canUpload = useMemo(() => {
    if (busy) return false;
    if (rows.length === 0) return false;
    // อัปโหลดเฉพาะไฟล์ที่ยังไม่ done
    return rows.some((r) => r.status === "queued" || r.status === "error");
  }, [busy, rows]);

  const pickFiles = () => inputRef.current?.click();

  const handleFiles = useCallback((files: FileList | null) => {
    if (!files || files.length === 0) return;
    const incoming = Array.from(files).filter((f) =>
      f.type.startsWith("image/")
    );
    if (incoming.length === 0) {
      toast("โปรดเลือกไฟล์รูปภาพเท่านั้น");
      return;
    }
    // ใช้ captionRef.current แทน caption
    const cap = captionRef.current;

    const newRows: FileRow[] = incoming.map((f) => ({
      file: f,
      previewUrl: URL.createObjectURL(f),
      title: f.name.replace(/\.[^.]+$/, ""), // default = ชื่อไฟล์ไม่เอาส่วนขยาย
      description: cap ? cap : "",
      progress: 0,
      status: "queued",
    }));
    setRows((prev) => [...newRows, ...prev]);
  }, []);

  // ---- Drag & Drop ----
  const onDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      setDragOver(false);
      handleFiles(e.dataTransfer.files);
    },
    [handleFiles]
  );

  const onDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(true);
  };
  const onDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
  };

  const removeRow = (idx: number) => {
    setRows((prev) => {
      const r = [...prev];
      const target = r[idx];
      if (target?.xhr && target.status === "uploading") {
        target.xhr.abort();
      }
      if (target) URL.revokeObjectURL(target.previewUrl);
      r.splice(idx, 1);
      return r;
    });
  };

  // ---- Upload per-file with XHR to get progress ----
  const uploadOne = (row: FileRow, idx: number) =>
    new Promise<void>((resolve) => {
      const form = new FormData();
      form.append("file", row.file);
      form.append("title", row.title);
      form.append("description", row.description);
      form.append("category", category);

      const xhr = new XMLHttpRequest();
      xhr.open("POST", "/api/upload", true);

      xhr.upload.onprogress = (ev) => {
        if (!ev.lengthComputable) return;
        const p = Math.round((ev.loaded / ev.total) * 100);
        setRows((prev) => {
          const copy = [...prev];
          const cur = copy[idx];
          if (cur) cur.progress = p;
          return copy;
        });
      };

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          setRows((prev) => {
            const copy = [...prev];
            const cur = copy[idx];
            if (cur) {
              cur.status = "done";
              cur.progress = 100;
              cur.xhr = undefined;
            }
            return copy;
          });
          resolve();
        } else {
          setRows((prev) => {
            const copy = [...prev];
            const cur = copy[idx];
            if (cur) {
              cur.status = "error";
              cur.xhr = undefined;
            }
            return copy;
          });
          resolve();
        }
      };

      xhr.onerror = () => {
        setRows((prev) => {
          const copy = [...prev];
          const cur = copy[idx];
          if (cur) {
            cur.status = "error";
            cur.xhr = undefined;
          }
          return copy;
        });
        resolve();
      };

      setRows((prev) => {
        const copy = [...prev];
        const cur = copy[idx];
        if (cur) {
          cur.status = "uploading";
          cur.progress = 1;
          cur.xhr = xhr;
        }
        return copy;
      });

      xhr.send(form);
    });

  const uploadAll = async () => {
    setBusy(true);
    // อัปโหลดเฉพาะ queued/error
    const targets = rows
      .map((r, idx) => ({ r, idx }))
      .filter(({ r }) => r.status === "queued" || r.status === "error");

    for (const { idx } of targets) {
      // index อาจจะขยับระหว่าง setState; หา index ใหม่จาก id อ้างอิงไม่ได้เพราะยังไม่เซฟ DB
      // ทางง่าย: อัปโหลดจากซ้ายไปขวา โดยอ่านค่า “สด” ทุกครั้ง
      const liveIdx = idx; // เราไม่ได้ลบแถวระหว่างอัปโหลด จึงใช้ได้โอเค
      // ถ้าต้องการ robust สุดๆ ควรเก็บ Map<File, index> หรือ uuid ต่อ row
      await uploadOne(rows[liveIdx], liveIdx);
    }

    setBusy(false);

    const anyError = rows.some((r) => r.status === "error");
    if (!anyError) {
      toast("อัปโหลดเสร็จสิ้น");
      // ล้างรายการที่สำเร็จออก (หรือจะคงไว้ก็ได้)
      setRows([]);
      setCaption("");
      onUploadSuccess();
    } else {
      toast("อัปโหลดบางไฟล์ล้มเหลว");
    }
  };

  return (
    <Card className="p-4 sm:p-6 space-y-4">
      {/* Composer Header */}
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary/70 to-primary/30" />
        <div className="flex-1">
          <Textarea
            placeholder="เขียนแคปชันหรือเล่าอะไรหน่อย..."
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            className="min-h-[72px] resize-y"
          />
        </div>
      </div>

      {/* Category Row (optional) */}
      <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
        <div className="sm:col-span-2">
          <Label htmlFor="category">หมวดหมู่</Label>
          <Input
            id="category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            placeholder="เช่น Album, Profile, Work..."
          />
        </div>
        <div className="sm:col-span-3 flex items-end">
          <Button
            type="button"
            variant="outline"
            className="w-full sm:w-auto"
            onClick={pickFiles}
          >
            <ImagePlus className="mr-2 h-4 w-4" />
            เลือกรูป
          </Button>
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => handleFiles(e.target.files)}
          />
        </div>
      </div>

      {/* Dropzone */}
      <div
        onDrop={onDrop}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        className={[
          "relative rounded-xl border border-dashed p-6 transition",
          dragOver
            ? "border-primary bg-primary/5"
            : "border-muted-foreground/30 bg-muted/30",
          "flex flex-col items-center justify-center text-center",
        ].join(" ")}
      >
        <Upload className="h-8 w-8 mb-2 opacity-70" />
        <div className="text-sm text-muted-foreground">
          ลากรูปมาวางที่นี่ หรือ{" "}
          <button
            className="text-primary underline"
            onClick={pickFiles}
            type="button"
          >
            เลือกไฟล์
          </button>
        </div>
      </div>

      {/* Selected previews */}
      {hasFiles && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {rows.map((row, idx) => (
              <Card key={row.previewUrl} className="p-3">
                <div className="relative w-full aspect-video overflow-hidden rounded-lg bg-muted">
                  <Image
                    src={row.previewUrl}
                    alt={row.title || row.file.name}
                    fill
                    className="object-cover"
                    unoptimized
                  />
                  <button
                    type="button"
                    className="absolute top-2 right-2 rounded-full bg-background/80 p-1 shadow hover:bg-background"
                    onClick={() => removeRow(idx)}
                    aria-label="remove"
                    disabled={row.status === "uploading"}
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                <div className="mt-3 space-y-2">
                  <Input
                    value={row.title}
                    onChange={(e) =>
                      setRows((prev) => {
                        const copy = [...prev];
                        copy[idx].title = e.target.value;
                        return copy;
                      })
                    }
                    placeholder="ชื่อรูป"
                  />
                  <Input
                    value={row.description}
                    onChange={(e) =>
                      setRows((prev) => {
                        const copy = [...prev];
                        copy[idx].description = e.target.value;
                        return copy;
                      })
                    }
                    placeholder="คำอธิบาย (ไม่บังคับ)"
                  />

                  {/* Progress + Status */}
                  {(row.status === "uploading" ||
                    row.status === "error" ||
                    row.status === "done") && (
                    <div className="space-y-1">
                      <Progress value={row.progress} />
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>
                          {row.status === "uploading" && "กำลังอัปโหลด..."}
                          {row.status === "done" && "อัปโหลดสำเร็จ"}
                          {row.status === "error" && "อัปโหลดล้มเหลว"}
                        </span>
                        {row.status === "uploading" && (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </Card>
            ))}
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setRows([])}
              disabled={busy || uploadingCount > 0}
            >
              ล้างรายการ
            </Button>
            <Button type="button" onClick={uploadAll} disabled={!canUpload}>
              {busy || uploadingCount > 0 ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  กำลังอัปโหลด ({doneCount}/{rows.length})
                </>
              ) : (
                "อัปโหลด"
              )}
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
}
