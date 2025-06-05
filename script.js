async function getTopAnime(limit = 100) { //Obtener los mejores animes de MyAnimeList
    let animes = [];
    const totalPages = Math.ceil(limit / 25); // Calculamos cuántas páginas necesitamos

    try {
        for (let i = 1; i <= totalPages; i++) {
            // Delay progresivo: empieza rápido, aumenta si hay muchas páginas
            const delay = Math.min(1000, i * 300); 
            await new Promise(resolve => setTimeout(resolve, delay)); 

            const response = await fetch(`https://api.jikan.moe/v4/top/anime?page=${i}`);

             
            if (response.status === 429) {
                await new Promise(resolve => setTimeout(resolve, 2000)); // Espera 2s y reintenta
                i--; // Repetir la misma página
                continue;
            }

            const data = await response.json();
            animes = animes.concat(data.data); // Agregamos los nuevos animes
        }

        return animes.slice(0, limit).map(anime => ({
            title: anime.title,
            image: anime.images.jpg.image_url
        }));

      
    } catch (error) {
        console.error("Error al obtener los animes:", error);
        return []; // Devuelve array vacío para que el programa no se caiga
    }
}


async function showRandomAnimes(count = 25) {  // Mostrar las imágenes aleatorias en la página 
    const container = document.getElementById("selector-items");
    container.innerHTML = "<p>Cargando animes...</p>"; // Mensaje de carga
    
    const animes = await getTopAnime(300); // Numero que indica el TOP del cual se están eligiendo los animes
    const randomAnimes = animes.sort(() => 0.5 - Math.random()).slice(0, count);
    
    container.innerHTML = "";
    randomAnimes.forEach(anime => {
        const img = document.createElement("img");
        img.src = anime.image;
        img.className = "item-image";
        img.draggable = true;
        container.appendChild(img);
    });
}

// 📌 **Se ejecuta automáticamente al cargar la página**
 showRandomAnimes(15);