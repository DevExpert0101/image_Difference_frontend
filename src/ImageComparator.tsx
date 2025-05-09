import React, { useEffect, useState, useRef, useMemo, act } from "react";


type ImageSource = 't0' | 't1' | 'changed' | null;

const ImageComparator: React.FC = () => {
    const [image1, setImage1] = useState<File | null>(null);
    const [image2, setImage2] = useState<File | null>(null);
    const [t0SelectedIndex, setT0SelectedIndex] = useState<number | null>(null);
    const [t1SelectedIndex, setT1SelectedIndex] = useState<number | null>(null);
    const [changeSelectedIndex, setChangeSelectedIndex] = useState<number | null>(null);

    const [t0Images, setT0Images] = useState<string[]>([]);
    const [t0Labels, setT0Labels] = useState<string[]>([]);
    const [t0Bboxes, setT0Bboxes] = useState<string[]>([]);

    const [t1Images, setT1Images] = useState<string[]>([]);
    const [t1Labels, setT1Labels] = useState<string[]>([]);
    const [t1Bboxes, setT1Bboxes] = useState<string[]>([]);
    const [changedImages, setChangedImages] = useState<string[]>([]);
    const [changedLabels, setChangedLabels] = useState<string[]>([]);
    const [changedBboxes, setChangedBboxes] = useState<string[]>([]);


    const [activeImageSource, setActiveImageSource] = useState<ImageSource>(null);
    const [loading, setLoading] = useState<boolean>(false);

    const [overlayBox, setOverlayBox] = useState<{ left: number, top: number, width: number, height: number } | null>(null);

    const image1Ref = useRef<HTMLImageElement | null>(null);
    const image2Ref = useRef<HTMLImageElement | null>(null);

    function refreshPage() {
        window.location.reload();
    }



    // const getActiveBox = () => {
    //     switch(activeImageSource){
    //         case 't0':

    //     }
    //     if (t0SelectedIndex !== null && t0Bboxes[t0SelectedIndex]) {
    //         // return parseBBox(t0Bboxes[t0SelectedIndex]);
    //         return t0Bboxes[t0SelectedIndex];
    //     }
    //     if (t1SelectedIndex !== null && t1Bboxes[t1SelectedIndex]) {
    //         // return parseBBox(t1Bboxes[t1SelectedIndex]);
    //         return t1Bboxes[t1SelectedIndex];
    //     }
    //     if (changeSelectedIndex !== null && changedBboxes[changeSelectedIndex]) {
    //         // return parseBBox(changedBboxes[changeSelectedIndex]);
    //         return changedBboxes[changeSelectedIndex];
    //     }
    //     return null;
    // };

    const getActiveBox = () => {
        switch (activeImageSource) {
            case 't0':
                return t0SelectedIndex !== null ? t0Bboxes[t0SelectedIndex] : null;
            case 't1':
                return t1SelectedIndex !== null ? t1Bboxes[t1SelectedIndex] : null;
            case 'changed':
                return changeSelectedIndex !== null ? changedBboxes[changeSelectedIndex] : null;
            default:
                return null;
        }
    };

    const parseBBox = (bboxStr: string): [number, number, number, number] => {
        return bboxStr.split(',').map(Number) as [number, number, number, number];
    };

    const activeBoxKey = useMemo(() => {
        const box = getActiveBox();
        console.log('box', box)
        return box ? box : null;
    }, [
        t0SelectedIndex, t0Bboxes,
        t1SelectedIndex, t1Bboxes,
        changeSelectedIndex, changedBboxes,
        activeImageSource
    ]);

    useEffect(() => {
        const box = getActiveBox();
        if (!box) {
            setOverlayBox(null);
            return;
        }

        const [x1, y1, x2, y2] = box;
        // const imgEl = image2Ref.current;

        // if (!imgEl || imgEl.naturalWidth === 0 || imgEl.naturalHeight === 0) return;
        const imgEl =
            activeImageSource === 't0' ? image1Ref.current :
                activeImageSource === 't1' ? image2Ref.current :
                    activeImageSource === 'changed' ? image2Ref.current :
                        null;

        if (!imgEl || imgEl.naturalWidth === 0 || imgEl.naturalHeight === 0) return;


        const containerWidth = imgEl.clientWidth;
        const containerHeight = imgEl.clientHeight;
        const imgAspectRatio = imgEl.naturalWidth / imgEl.naturalHeight;
        const containerAspectRatio = containerWidth / containerHeight;

        let renderedWidth, renderedHeight, offsetX, offsetY;

        if (imgAspectRatio > containerAspectRatio) {
            // Image is constrained by width
            renderedWidth = containerWidth;
            renderedHeight = containerWidth / imgAspectRatio;
            offsetX = 0;
            offsetY = (containerHeight - renderedHeight) / 2;
        } else {
            // Image is constrained by height
            renderedHeight = containerHeight;
            renderedWidth = containerHeight * imgAspectRatio;
            offsetY = 0;
            offsetX = (containerWidth - renderedWidth) / 2;
        }

        const scaleX = renderedWidth / imgEl.naturalWidth;
        const scaleY = renderedHeight / imgEl.naturalHeight;

        setOverlayBox({
            left: offsetX + x1 * scaleX,
            top: offsetY + y1 * scaleY,
            width: (x2 - x1) * scaleX,
            height: (y2 - y1) * scaleY,
        });
    }, [activeBoxKey]);


    const handleCompare = async () => {
        if (!image1 || !image2) {
            alert("Please upload both images before comparing.");
            return;
        }

        setLoading(true);
        setT0Images([]);
        setT0Labels([]);
        setT0Bboxes([]);
        setT1Images([]);
        setT1Labels([]);
        setT1Bboxes([]);
        setChangedImages([]);
        setChangedLabels([]);
        setChangedBboxes([]);
        setT0SelectedIndex(null);
        setT1SelectedIndex(null);
        setChangeSelectedIndex(null);
        setOverlayBox(null);

        const formData = new FormData();
        formData.append("image1", image1);
        formData.append("image2", image2);

        try {
            // const response = await fetch("http://80.15.7.37:41655/compare", {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/compare`, {
                method: "POST",
                body: formData,
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();
            setT0Images(result.t0_images.map((img: string) => `data:image/jpg;base64,${img}`));
            setT0Labels(result.t0_labels);
            setT0Bboxes(result.t0_bboxes);

            setT1Images(result.t1_images.map((img: string) => `data:image/jpg;base64,${img}`));
            setT1Labels(result.t1_labels);
            setT1Bboxes(result.t1_bboxes);

            setChangedImages(result.changed_images.map((img: string) => `data:image/jpg;base64,${img}`));
            setChangedLabels(result.changed_labels);
            setChangedBboxes(result.changed_bboxes);
            console.log("Comparison Result:", result);
        } catch (error) {
            console.error("Error comparing images:", error);
        } finally {
            setLoading(false);
        }
    };

    // return (
    //     <div className="w-full flex flex-col items-center p-10">
    //         <h1 className="text-4xl font-bold">Compare Room Images</h1>
    //         <p className="text-gray-600 mt-6">Find the difference between room images</p>
    //         <div className="w-full flex justify-center items-center gap-x-4 mt-6">
    //             {[setImage1, setImage2].map((setImage, index) => (
    //                 <div key={index} className="w-1/2 h-[600px] flex flex-col items-center justify-center border-dashed border-2 border-gray-400 p-4 rounded-lg bg-gray-900 text-white">
    //                     {index === 0 ? (!image1 ? (
    //                         <>
    //                             <label className="cursor-pointer">
    //                                 <input type="file" className="hidden" onChange={(e) => {
    //                                     if (e.target.files)
    //                                         setImage(e.target.files[0])
    //                                 }} />
    //                                 <div className="flex flex-col items-center">
    //                                     <span className="text-3xl flex items-center border-2 border-amber-50 p-2 rounded-xl">📂 CHOOSE CLEAN IMAGE</span>
    //                                     <p className="text-sm text-gray-400">or drop image here</p>
    //                                 </div>
    //                             </label>
    //                         </>
    //                     ) : (
    //                         <img src={image1 ? URL.createObjectURL(image1) : ''} alt="Uploaded 1" className="h-full w-full object-contain" />
    //                     )) : (!image2 ? (
    //                         <>
    //                             <label className="cursor-pointer">
    //                                 <input type="file" className="hidden" onChange={(e) => {
    //                                     if (e.target.files)
    //                                         setImage(e.target.files[0])
    //                                 }} />
    //                                 <div className="flex flex-col items-center">
    //                                     <span className="text-3xl flex items-center border-2 border-amber-50 p-2 rounded-xl">📂 CHOOSE MESSY IMAGE</span>
    //                                     <p className="text-sm text-gray-400">or drop image here</p>
    //                                 </div>
    //                             </label>
    //                         </>
    //                     ) : (
    //                         <img src={image2 ? URL.createObjectURL(image2) : ''} alt="Uploaded 2" className="h-full w-full object-contain" />
    //                     ))}

    //                     {index === 0 ? (
    //                         <div className="relative w-full h-full">
    //                             {image1 && (
    //                                 <img
    //                                     src={URL.createObjectURL(image1)}
    //                                     alt="Uploaded 1"
    //                                     className="h-full w-full object-contain"
    //                                 />
    //                             )}
    //                             {selectedIndex !== null && (
    //                                 <div
    //                                     className="absolute border-2 border-red-500"
    //                                     style={{
    //                                         top: `${resultBboxes[selectedIndex][1]}px`,
    //                                         left: `${resultBboxes[selectedIndex][0]}px`,
    //                                         width: `${resultBboxes[selectedIndex][2] - resultBboxes[selectedIndex][0]}px`,
    //                                         height: `${resultBboxes[selectedIndex][3] - resultBboxes[selectedIndex][1]}px`,
    //                                         pointerEvents: 'none',
    //                                     }}
    //                                 ></div>
    //                             )}
    //                         </div>
    //                     ) : (
    //                         <div className="relative w-full h-full">
    //                             {image2 && (
    //                                 <img
    //                                     src={URL.createObjectURL(image2)}
    //                                     alt="Uploaded 2"
    //                                     className="h-full w-full object-contain"
    //                                 />
    //                             )}
    //                             {selectedIndex !== null && (
    //                                 <div
    //                                     className="absolute border-2 border-red-500"
    //                                     style={{
    //                                         top: `${resultBboxes[selectedIndex][1]}px`,
    //                                         left: `${resultBboxes[selectedIndex][0]}px`,
    //                                         width: `${resultBboxes[selectedIndex][2] - resultBboxes[selectedIndex][0]}px`,
    //                                         height: `${resultBboxes[selectedIndex][3] - resultBboxes[selectedIndex][1]}px`,
    //                                         pointerEvents: 'none',
    //                                     }}
    //                                 ></div>
    //                             )}
    //                         </div>
    //                     )}

    //                 </div>
    //             ))}
    //         </div>
    //         <div className="flex flex-col">
    //             <div className="flex justify-center gap-4">
    //                 <button
    //                     className="mt-6 px-6 py-3 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition"
    //                     onClick={refreshPage}
    //                 >
    //                     Refresh
    //                 </button>

    //                 <button
    //                     className="mt-6 px-6 py-3 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition"
    //                     onClick={handleCompare}
    //                 >
    //                     Compare
    //                 </button>
    //             </div>
    //             <div>

    //                 {loading && (
    //                     <div className="flex justify-center mt-6 text-center">
    //                         <div className="flex justify-center animate-spin rounded-full h-12 w-12 border-t-4 border-blue-600 border-solid"></div>
    //                         {/* <p className="mt-2 text-gray-600">Processing...</p> */}
    //                     </div>
    //                 )}
    //                 {resultImages.length > 0 && (
    //                     <div className="mt-6 flex justify-center gap-4">

    //                         {/* <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-4"> */}
    //                         {/* {resultImages.map((img, index) => (
    //                             <div key={index} className="flex flex-col items-center">
    //                                 <img src={img} alt={resultLabels[index]} className="w-[300px] h-[200px] object-contain border border-gray-400 rounded-lg" />
    //                             </div>
    //                         ))} */}
    //                         {resultImages.map((img, index) => (
    //                             <div key={index} className="flex flex-col items-center">
    //                                 <img
    //                                     src={img}
    //                                     alt={resultLabels[index]}
    //                                     className="w-[300px] h-[200px] object-contain border border-gray-400 rounded-lg cursor-pointer"
    //                                     onClick={() => setSelectedIndex(index)}
    //                                 />
    //                             </div>
    //                         ))}


    //                     </div>
    //                 )}
    //             </div>
    //         </div>
    //     </div>
    // );

    return (
        <div className="w-full flex flex-col items-center p-10">
            <h1 className="text-4xl font-bold">Compare Room Images</h1>
            <p className="text-gray-600 mt-6">Find the difference between room images</p>
            <div className="w-full flex justify-center items-center gap-x-4 mt-6">
                {[setImage1, setImage2].map((setImage, index) => {
                    const currentImage = index === 0 ? image1 : image2;
                    const currentRef = index === 0 ? image1Ref : image2Ref;
                    // const sourceTag = index === 0 ? 't0' : 't1'; // or use other tag names if needed
                    const sourceTag = index === 0 ? 't0' : 't1_or_changed';
                    const shouldShowOverlay = (
                        (index === 0 && activeImageSource === 't0') ||
                        (index === 1 && (activeImageSource === 't1' || activeImageSource === 'changed'))
                    );

                    return (

                        <div key={index} className="w-1/2 h-[600px] flex flex-col items-center justify-center border-dashed border-2 border-gray-400 p-4 rounded-lg bg-gray-900 text-white relative">
                            {/* {!((index === 0 ? image1 : image2)) ? ( */}
                            {!currentImage ? (
                                <label className="cursor-pointer">
                                    <input type="file" className="hidden" onChange={(e) => {
                                        if (e.target.files) setImage(e.target.files[0]);
                                    }} />
                                    <div className="flex flex-col items-center">
                                        <span className="text-3xl flex items-center border-2 border-amber-50 p-2 rounded-xl">
                                            📂 CHOOSE {index === 0 ? "CLEAN" : "MESSY"} IMAGE
                                        </span>
                                        <p className="text-sm text-gray-400">or drop image here</p>
                                    </div>
                                </label>
                            ) : (
                                <div className="relative w-full h-full">
                                    <img
                                        src={URL.createObjectURL(index === 0 ? image1! : image2!)}
                                        alt={`Uploaded ${index + 1}`}
                                        ref={currentRef}
                                        className="h-full w-full object-contain"
                                    />
                                    {/* {index === 1 && overlayBox && ( */}
                                    {shouldShowOverlay && overlayBox && (
                                        <div
                                            // className="absolute border-4 border-red-500"
                                            className="absolute transition-all duration-300 ease-in-out border-2 border-red-500 rounded-md shadow-[0_0_10px_rgba(255,0,0,0.7)] hover:scale-110 hover:z-50"
                                            style={{
                                                top: `${overlayBox.top}px`,
                                                left: `${overlayBox.left}px`,
                                                width: `${overlayBox.width}px`,
                                                height: `${overlayBox.height}px`,
                                                // pointerEvents: "none",
                                                zIndex: 10,
                                            }}
                                        />
                                    )}
                                </div>
                            )}
                        </div>
                    )
                })
                }
            </div>

            <div className="flex flex-col w-full">
                {/* <div className="w-full overflow-x-auto scroll-smooth"> */}
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

                {loading && (
                    <div className="flex justify-center mt-6 text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-blue-600 border-solid"></div>
                    </div>
                )}
                <div className="overflow-x-auto scroll-smooth">

                    {t0Images.length > 0 && (
                        <div className="w-full overflow-x-auto">
                            <h2 className="text-xl font-semibold text-black mb-2">🟥 Removed Objects (T0)</h2>
                            <div className="mt-6 flex justify-center gap-4 flex-nowrap">
                                {t0Images.map((img, index) => (
                                    <div key={index} className="flex flex-col items-center">
                                        <img
                                            src={img}
                                            alt={t0Images[index]}
                                            className="w-[300px] h-[200px] object-contain border border-gray-400 rounded-lg cursor-pointer"
                                            // className="h-40 w-auto cursor-pointer border-2 border-transparent hover:border-amber-400 rounded"
                                            onClick={() => { setT0SelectedIndex(index); setActiveImageSource('t0'); }}
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                    <hr />
                    {t1Images.length > 0 && (
                        <div className="w-full overflow-x-auto mt-4">
                            <h2 className="text-xl font-semibold text-black mb-2">🟩 Newly Appeared Objects (T1)</h2>
                            <div className="mt-6 flex justify-center gap-4 flex-nowrap">
                                {t1Images.map((img, index) => (
                                    <div key={index} className="flex flex-col items-center">
                                        <img
                                            src={img}
                                            alt={t1Images[index]}
                                            className="w-[300px] h-[200px] object-contain border border-gray-400 rounded-lg cursor-pointer"
                                            onClick={() => { setT1SelectedIndex(index); setActiveImageSource('t1'); }}
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                    <hr />
                    {changedImages.length > 0 && (
                        <div className="w-full overflow-x-auto mt-4">
                            <h2 className="text-xl font-semibold text-black mb-2">🟦 Detected Changes</h2>
                            <div className="mt-6 flex justify-center gap-4 flex-nowrap">
                                {changedImages.map((img, index) => (
                                    <div key={index} className="flex flex-col items-center">
                                        <img
                                            src={img}
                                            alt={changedImages[index]}
                                            className="w-[300px] h-[200px] object-contain border border-gray-400 rounded-lg cursor-pointer"
                                            onClick={() => { setChangeSelectedIndex(index); setActiveImageSource('changed'); }}
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ImageComparator;
