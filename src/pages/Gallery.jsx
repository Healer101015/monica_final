import React from "react";

// ===================== DADOS DA GALERIA =====================
// Importe as imagens dos seus bolos.
// Certifique-se de que as imagens estão na pasta `src/pages/assets`
import bolo1 from "./assets/bolo1.jpg";
import bolo2 from "./assets/bolo2.jpg";
import bolo3 from "./assets/bolo3.jpg";
import bolo4 from "./assets/bolo4.jpg";
import bolo5 from "./assets/bolo5.jpg";
import bolo6 from "./assets/bolo6.jpg";
import bolo7 from "./assets/bolo7.jpg";
import bolo8 from "./assets/bolo8.jpg";


const cakeImages = [
    bolo1,
    bolo2,
    bolo3,
    bolo4,
    bolo5,
    bolo6,
    bolo7,
    bolo8,

];

// ===================== COMPONENTE =====================
export default function Gallery() {
    return (
        <div className="bg-white rounded-2xl shadow-sm border border-pink-100 p-4 sm:p-6">
            <h2 className="text-2xl font-bold text-center mb-6">Nossos Bolos</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {cakeImages.map((image, index) => (
                    <div key={index} className="overflow-hidden rounded-lg shadow-lg group">
                        <img
                            src={image}
                            alt={`Bolo ${index + 1}`}
                            className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-300"
                        />
                    </div>
                ))}
            </div>
        </div>
    );
}