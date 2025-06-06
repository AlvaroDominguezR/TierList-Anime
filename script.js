        let draggedElement = null;
        let sourceContainer = null;

        const $ = el => document.querySelector(el);
        const $$ = el => document.querySelectorAll(el);


        //Funciones Drag and Drop
        function handleDragStart(e) {
            if(!e.target.classList.contains('item-image')) return;

            draggedElement = e.target;
            sourceContainer = e.target.parentNode;

            //mejora visual opcional
            e.target.style.opacity = '0.5';
            e.dataTransfer.setData('text/plain', e.target.src);
            e.dataTransfer.effectAllowed = 'move'; 
        }

        function handleDragEnd(e) {
            if (!e.target.classList.contains('item-image')) return;
            e.target.style.opacity = '1';
            draggedElement = null;
            sourceContainer = null;

            // Limpia clases de feedback visual
             $$('.drag-over').forEach(el => el.classList.remove('drag-over'));
        }

        function handleDragOver(e) {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'move';    
        }

        function handleDrop(e) {
            e.preventDefault();

            if(!draggedElement) return;

            const dropZone = e.currentTarget.classList.contains('dropZone')
                ? e.currentTarget
                : e.currentTarget.closest('.drop-zone');

            if(!dropZone) return;

             // Mover el elemento al nuevo contenedor
            if(sourceContainer && draggedElement) {
                sourceContainer.removeChild(draggedElement);
            }

            dropZone.appendChild(draggedElement);
            draggedElement.style.opacity = '1';
            dropZone.classList.remove('drag-over');
        }

        function handleDragEnter(e) {
            e.preventDefault();
            if(e.currentTarget === sourceContainer) return;
            e.currentTarget.classList.add('drag-over');
        }

        function handleDragLeave(e) {
            e.preventDefault();
            e.currentTarget.classList.remove('drag-over');
        }

        function setupDragAndDrop () {
            const rows = $$('.tier .row');
            const itemsSection = $('#selector-items');

            rows.forEach(row => {
                if(!row.querySelector('drop-zone')) {
                    const dropZone = document.createElement('div');
                    dropZone.className = 'drop-zone';
                    row.appendChild(dropZone);
                }

                const dropZone = row.querySelector('.drop-zone');
                dropZone.addEventListener('dragover', handleDragOver);
                dropZone.addEventListener('drop', handleDrop);
                dropZone.addEventListener('dragenter', handleDragEnter);
                dropZone.addEventListener('dragleave', handleDragLeave);
            });

            itemsSection.addEventListener('dragover', handleDragOver);
            itemsSection.addEventListener('drop', handleDrop);
            itemsSection.addEventListener('dragenter', handleDragEnter);
            itemsSection.addEventListener('dragleave', handleDragLeave);

            document.addEventListener('dragstart', (e) => 
            {
                if(e.target.classList.contains('item-image')) {
                    handleDragStart(e);
                }
            })

            document.addEventListener('dragend', (e) => {
                if(e.target.classList.contains('item-image')) {
                    handleDragEnd(e);
                }
            });
        }
        

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


async function showRandomAnimes(count = 25) {
    const container = $('#selector-items');
    container.innerHTML = "<p>Seleccionando animes aleatoriamente...</p>"; // Mensaje de carga
    
    const animes = await getTopAnime(300); // Número que indica el TOP del cual se están eligiendo los animes
    const randomAnimes = animes.sort(() => 0.5 - Math.random()).slice(0, count);
    
    container.innerHTML = "";
    randomAnimes.forEach(anime => {
        // Contenedor para imagen + tooltip
        const imgContainer = document.createElement("div");
        imgContainer.className = "item-container";
        
        // Crear imagen
        const img = document.createElement("img");
        img.src = anime.image;
        img.className = "item-image";
        img.draggable = true;
        
        // Crear tooltip con el título
        const tooltip = document.createElement("span");
        tooltip.className = "item-tooltip";
        tooltip.textContent = anime.title;
        
        // Ensamblar
        imgContainer.appendChild(img);
        imgContainer.appendChild(tooltip);
        container.appendChild(imgContainer);

    });

    setupDragAndDrop();
}

document.addEventListener('DOMContentLoaded', () => {
    showRandomAnimes(20);
});
