import { useRef } from "react";
import { Upload, X, Image, Music, Video } from "lucide-react";
import { Button } from "@/components/ui/button";

interface MediaUploaderProps {
    accept: "image" | "audio" | "video";
    value: string;
    onChange: (base64: string) => void;
    label?: string;
}

const ACCEPT_MAP = {
    image: "image/*",
    audio: "audio/*",
    video: "video/*",
};

const ICON_MAP = {
    image: Image,
    audio: Music,
    video: Video,
};

export function MediaUploader({ accept, value, onChange, label }: MediaUploaderProps) {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const Icon = ICON_MAP[accept];

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = () => {
            const result = reader.result as string;
            onChange(result);
        };
        reader.readAsDataURL(file);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        const file = e.dataTransfer.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = () => {
            const result = reader.result as string;
            onChange(result);
        };
        reader.readAsDataURL(file);
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
    };

    return (
        <div className="space-y-2">
            {label && <label className="text-sm font-medium text-gray-700">{label}</label>}

            {value ? (
                <div className="relative rounded-lg overflow-hidden border-2 border-gray-200 group">
                    {accept === "image" && (
                        <img src={value} alt="Preview" className="w-full h-32 object-cover" />
                    )}
                    {accept === "audio" && (
                        <div className="p-4 bg-gray-50 flex items-center gap-3">
                            <Music className="h-8 w-8 text-[#2B4B7C]" />
                            <audio src={value} controls className="flex-1 h-8" />
                        </div>
                    )}
                    {accept === "video" && (
                        <video src={value} controls className="w-full h-32 object-cover" />
                    )}
                    <button
                        onClick={() => onChange("")}
                        className="absolute top-2 right-2 p-1 rounded-full bg-red-500 text-white opacity-0 group-hover:opacity-100 transition-opacity shadow-md"
                    >
                        <X className="h-3 w-3" />
                    </button>
                </div>
            ) : (
                <div
                    onClick={() => fileInputRef.current?.click()}
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                    className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-[#FF8C42] hover:bg-[#FF8C42]/5 transition-all group"
                >
                    <div className="flex flex-col items-center gap-2">
                        <div className="p-3 rounded-full bg-gray-100 group-hover:bg-[#FF8C42]/10 transition-colors">
                            <Icon className="h-6 w-6 text-gray-400 group-hover:text-[#FF8C42] transition-colors" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-gray-600">
                                Clique ou arraste um arquivo
                            </p>
                            <p className="text-xs text-gray-400 mt-1">
                                {accept === "image" && "PNG, JPG, GIF, WebP"}
                                {accept === "audio" && "MP3, WAV, OGG"}
                                {accept === "video" && "MP4, WebM"}
                            </p>
                        </div>
                    </div>
                </div>
            )}

            <input
                ref={fileInputRef}
                type="file"
                accept={ACCEPT_MAP[accept]}
                onChange={handleFileSelect}
                className="hidden"
            />
        </div>
    );
}
