let draggedElement = null;
let sourceContainer = null;

const $ = el => document.querySelector(el);
const $$ = el => document.querySelectorAll(el);

//Funciones Drag and Drop
function handleDragStart(e) {
    if (!e.target.classList.contains('item-image')) return;

    draggedElement = e.target;
    sourceContainer = e.target.parentNode;

    draggedElement.classList.add('dragging');
    e.dataTransfer.setData('text/plain', e.target.src);
    e.dataTransfer.effectAllowed = 'move';
}

function handleDragEnd(e) {
    if (!e.target.classList.contains('item-image')) return;

    draggedElement.classList.remove('dragging');
    $$('.drag-over').forEach(el => el.classList.remove('drag-over'));
    draggedElement = null;
    sourceContainer = null;
}

function handleDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
}

function handleDrop(e) {
    e.preventDefault();
    if (!draggedElement) return;

    const target = e.target;
    const isSelector = target.id === 'selector-items';

    const dropZone = isSelector
        ? target
        : target.closest('.row')?.querySelector('.drop-zone');

    if (!dropZone) return;

    // Reordenamiento dentro de los tiers
    const targetContainer = target.closest('.item-container');
    if (targetContainer && dropZone.contains(targetContainer) && draggedElement !== targetContainer.querySelector('.item-image')) {
        dropZone.insertBefore(sourceContainer, targetContainer);
    } else if (!isSelector) {
        dropZone.appendChild(sourceContainer);
    } else {
        // Al selector, crear nuevo contenedor con tooltip
        const newContainer = document.createElement('div');
        newContainer.className = 'item-container';

        const tooltip = document.createElement('span');
        tooltip.className = 'item-tooltip';
        tooltip.textContent = draggedElement.alt || draggedElement.title || 'Anime';

        newContainer.appendChild(draggedElement);
        newContainer.appendChild(tooltip);
        dropZone.appendChild(newContainer);
    }

    draggedElement.classList.remove('dragging');
    $$('.drag-over').forEach(el => el.classList.remove('drag-over'));
}

function handleDragEnter(e) {
    e.preventDefault();
    const target = e.currentTarget;

    if (target.classList.contains('drop-zone') || target === $('#selector-items')) {
        target.classList.add('drag-over');

        if (target.classList.contains('drop-zone')) {
            target.closest('.row').classList.add('drag-over');
        }
    }
}

function handleDragLeave(e) {
    e.preventDefault();
    const target = e.currentTarget;

    if (target.classList.contains('drop-zone') || target === $('#selector-items')) {
        target.classList.remove('drag-over');

        if (target.classList.contains('drop-zone')) {
            target.closest('.row').classList.remove('drag-over');
        }
    }
}

function setupDragAndDrop() {
    const rows = $$('.tier .row');
    const itemsSection = $('#selector-items');

    rows.forEach(row => {
        if (!row.querySelector('.drop-zone')) {
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

    document.addEventListener('dragstart', (e) => {
        if (e.target.classList.contains('item-image')) {
            handleDragStart(e);
        }
    });

    document.addEventListener('dragend', (e) => {
        if (e.target.classList.contains('item-image')) {
            handleDragEnd(e);
        }
    });
}

async function getTopAnime(limit = 100) {
    let animes = [];
    const totalPages = Math.ceil(limit / 25);

    try {
        for (let i = 1; i <= totalPages; i++) {
            const delay = Math.min(1000, i * 300);
            await new Promise(resolve => setTimeout(resolve, delay));

            const response = await fetch(`https://api.jikan.moe/v4/top/anime?page=${i}`);

            if (response.status === 429) {
                await new Promise(resolve => setTimeout(resolve, 2000));
                i--;
                continue;
            }

            const data = await response.json();
            animes = animes.concat(data.data);
        }

        return animes.slice(0, limit).map(anime => ({
            title: anime.title,
            image: anime.images.jpg.image_url
        }));
    } catch (error) {
        console.error("Error al obtener los animes:", error);
        return [];
    }
}

async function showRandomAnimes(count = 25) {
    const container = $('#selector-items');
    container.innerHTML = "<p>Seleccionando animes aleatoriamente...</p>";

    const animes = await getTopAnime(300); //Top del cual se eligen los animes
    const randomAnimes = animes.sort(() => 0.5 - Math.random()).slice(0, count);

    container.innerHTML = "";
    randomAnimes.forEach(anime => {
        const imgContainer = document.createElement("div");
        imgContainer.className = "item-container";

        const img = document.createElement("img");
        img.src = anime.image;
        img.className = "item-image";
        img.draggable = true;
        img.alt = anime.title;

        const tooltip = document.createElement("span");
        tooltip.className = "item-tooltip";
        tooltip.textContent = anime.title;

        imgContainer.appendChild(img);
        imgContainer.appendChild(tooltip);
        container.appendChild(imgContainer);
    });

    setupDragAndDrop();
}

document.addEventListener('DOMContentLoaded', () => {
    showRandomAnimes(15);
});
