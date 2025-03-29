import React, { useState } from "react";

const ImageComparator: React.FC = () => {
    const [image1, setImage1] = useState<string | null>(null);
    const [image2, setImage2] = useState<string | null>(null);
    const [originalImage1, setOriginalImage1] = useState<string | null>(null);
    const [originalImage2, setOriginalImage2] = useState<string | null>(null);
    const [resultImages, setResultImages] = useState<string[]>([]);
    const [resultLabels, setResultLabels] = useState<string[]>([]);
    const [loading, setLoading] = useState<boolean>(false);

    const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>, setImage: React.Dispatch<React.SetStateAction<string | null>>, containerWidth: number, containerHeight: number) => {
        const file = event.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                const img = new Image();
                img.src = e.target?.result as string;
                img.onload = () => {
                    const canvas = document.createElement("canvas");
                    const ctx = canvas.getContext("2d");
                    if (!ctx) return;

                    // Maintain aspect ratio while fitting within container
                    let newWidth = img.width;
                    let newHeight = img.height;
                    const aspectRatio = img.width / img.height;

                    if (newWidth > containerWidth) {
                        newWidth = containerWidth;
                        newHeight = newWidth / aspectRatio;
                    }
                    if (newHeight > containerHeight) {
                        newHeight = containerHeight;
                        newWidth = newHeight * aspectRatio;
                    }

                    canvas.width = newWidth;
                    canvas.height = newHeight;
                    ctx.drawImage(img, 0, 0, newWidth, newHeight);

                    setImage(canvas.toDataURL("image/png"));
                };
            };
            reader.readAsDataURL(file);
        }
    };

    function refreshPage() {
        window.location.reload();
    }

    const handleCompare = async () => {
        if (!image1 || !image2) {
            alert("Please upload both images before comparing.");
            return;
        }

        setLoading(true);
        setResultImages([]);
        setResultLabels([]);

        const blob1 = await fetch(image1).then(res => res.blob());
        const blob2 = await fetch(image2).then(res => res.blob());

        const formData = new FormData();
        formData.append("image1", blob1, "image1.png");
        formData.append("image2", blob2, "image2.png");

        try {
            const response = await fetch("http://localhost:8000/compare", {
                method: "POST",
                body: formData,
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();
            setResultImages(result.images.map((img: string) => `data:image/png;base64,${img}`));
            setResultLabels(result.labels);
            console.log("Comparison Result:", result);
        } catch (error) {
            console.error("Error comparing images:", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="w-full flex flex-col items-center p-10">
            <h1 className="text-4xl font-bold">Compare Room Images</h1>
            <p className="text-gray-600 mt-6">Find the difference between room images</p>
            <div className="w-full flex justify-center items-center gap-x-4 mt-6">
                {[setImage1, setImage2].map((setImage, index) => (
                    <div key={index} className="w-1/2 h-[600px] flex flex-col items-center justify-center border-dashed border-2 border-gray-400 p-4 rounded-lg bg-gray-900 text-white">
                        {index === 0 ? (!image1 ? (
                            <>
                                <label className="cursor-pointer">
                                    <input type="file" className="hidden" onChange={(e) => handleImageUpload(e, setImage)} />
                                    <div className="flex flex-col items-center">
                                        <span className="text-3xl flex items-center border-2 border-amber-50 p-2 rounded-xl">📂 CHOOSE CLEAN IMAGE</span>
                                        <p className="text-sm text-gray-400">or drop image here</p>
                                    </div>
                                </label>
                            </>
                        ) : (
                            <img src={image1} alt="Uploaded 1" className="h-full w-full object-contain" />
                        )) : (!image2 ? (
                            <>
                                <label className="cursor-pointer">
                                    <input type="file" className="hidden" onChange={(e) => handleImageUpload(e, setImage)} />
                                    <div className="flex flex-col items-center">
                                        <span className="text-3xl flex items-center border-2 border-amber-50 p-2 rounded-xl">📂 CHOOSE MESSY IMAGE</span>
                                        <p className="text-sm text-gray-400">or drop image here</p>
                                    </div>
                                </label>
                            </>
                        ) : (
                            <img src={image2} alt="Uploaded 2" className="h-full w-full object-contain" />
                        ))}
                    </div>
                ))}
            </div>
            <div className="flex flex-col">
                <div className="flex justify-center gap-4">
                    <button
                        className="mt-6 px-6 py-3 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition"
                        onClick={refreshPage}
                    >
                        Refresh
                    </button>

                    <button
                        className="mt-6 px-6 py-3 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition"
                        onClick={handleCompare}
                    >
                        Compare
                    </button>
                </div>
                <div>

                    {loading && (
                        <div className="flex justify-center mt-6 text-center">
                            <div className="flex justify-center animate-spin rounded-full h-12 w-12 border-t-4 border-blue-600 border-solid"></div>
                            {/* <p className="mt-2 text-gray-600">Processing...</p> */}
                        </div>
                    )}
                    {resultImages.length > 0 && (
                        <div className="mt-6 flex justify-center gap-4">

                            {/* <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-4"> */}
                            {resultImages.map((img, index) => (
                                <div key={index} className="flex flex-col items-center">
                                    <img src={img} alt={resultLabels[index]} className="w-[300px] h-[200px] object-contain border border-gray-400 rounded-lg" />
                                    {/* <p className="mt-2 text-sm font-semibold">{resultLabels[index]}</p> */}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ImageComparator;
