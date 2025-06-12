let draggedElement = null;
let sourceContainer = null;
let placeholder = document.createElement('div');
placeholder.className = 'preview-placeholder';

let lastDragOverTime = 0; // Debounce para limitar las actualizaciones del placeholder
const dragOverThrottle = 100; // Milisegundos entre actualizaciones

const $ = el => document.querySelector(el);
const $$ = el => document.querySelectorAll(el);


//Funciones Drag and Drop

function handleDragStart(e) {
    if (!e.target.classList.contains('item-image')) return;

    draggedElement = e.target;
    sourceContainer = e.target.parentNode;

    draggedElement.classList.add('dragging');
    
    setTimeout(() =>
    {
        draggedElement.style.opacity = "0"; // Oculta la imagen original
    }, 0);
    
    placeholder.innerHTML = ''; // Inicializar placeholder
    const clonedImage = draggedElement.cloneNode();
    clonedImage.classList.add('placeholder-image');
    clonedImage.draggable = false;
    placeholder.appendChild(clonedImage);
    placeholder.dataset.src = draggedElement.src;
}

function handleDragEnd(e) {
    if (!e.target.classList.contains('item-image')) return;

    draggedElement.classList.remove('dragging');
    draggedElement.style.opacity = "1"
    
    $$('.drag-over').forEach(el => el.classList.remove('drag-over'));
    $$('.placeholder-target').forEach(el => el.classList.remove('placeholder-target'));

    if(placeholder && placeholder.parentNode)
    {
        placeholder.remove();
    }

    draggedElement = null;
    sourceContainer = null;
}

function handleDragOver(e)
{
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';

    const now = Date.now()
    if(now - lastDragOverTime < dragOverThrottle) return; // Throttle más estricto
    lastDragOverTime = now

    const zone = e.currentTarget;
    if(!zone.classList.contains('drop-zone') && zone.id !== 'selector-items') return;

    const afterElement = getDragAfterElement(zone, e.clientX, e.clientY);
    
    $$('.placeholder-target').forEach(el => el.classList.remove('placeholder-target')); // Limpiar clases anteriores

    if (afterElement)
    {
        afterElement.classList.add('placeholder-target');
        if (placeholder.parentNode !== zone || placeholder.nextSibling !== afterElement)
        {
            zone.insertBefore(placeholder, afterElement);
        }
    } 
    else
    {
        if (placeholder.parentNode !== zone)
        {
            zone.appendChild(placeholder);
        }
        else if (placeholder.nextSibling)
        {
            zone.appendChild(placeholder); // Asegurar que esté al final
        }
    }
}

function getDragAfterElement(container, x, y)
{
    const items = [...container.querySelectorAll('.item-container:not(.dragging)')];

    if (items.length === 0) // Si el contenedor está vacío, permitir inserción al final
    {
        return null;
    }
    
    const rows = {}; // Agrupar ítems por filas según su posición vertical
    items.forEach(item =>
    {
        const rect = item.getBoundingClientRect();
        const top = Math.round(rect.top); // Agrupar por top redondeado
        if (!rows[top]) rows[top] = [];
        rows[top].push({ item, rect });
    });

    const rowTops = Object.keys(rows).sort((a, b) => a - b).map(Number);
    
    let targetRow = null; // Encontrar la fila objetivo basada en la posición Y del mouse
    for (let i = 0; i < rowTops.length; i++)
    {
        const top = rowTops[i];
        const rowItems = rows[top];
        const firstRect = rowItems[0].rect;
        const lastRect = rowItems[rowItems.length - 1].rect;

        if (y >= firstRect.top && y <= lastRect.bottom) // Considerar la fila si el mouse está dentro de su rango vertical
        {
            targetRow = rowItems;
            break;
        }
    }
    
    if (!targetRow && y > rows[rowTops[rowTops.length - 1]][0].rect.bottom) // Si el mouse está por debajo de la última fila, usar la última fila como objetivo
    { 
        targetRow = rows[rowTops[rowTops.length - 1]];
    }
    if (!targetRow && y < rows[rowTops[0]][0].rect.top) // Si el mouse está por encima de la primera fila, usar la primera fila
    {
        targetRow = rows[rowTops[0]];
    }
    if (!targetRow && rowTops.length > 0)
    {
        targetRow = rows[rowTops[rowTops.length - 1]];
    }
    if (targetRow) // Ordenar ítems por posición horizontal
    {
        targetRow.sort((a, b) => a.rect.left - b.rect.left);

        for (let i = 0; i < targetRow.length; i++)
        {
            const { rect } = targetRow[i];
            
            if (x < rect.left + rect.width / 2) // Insertar antes del ítem si el mouse está a la izquierda de su centro
            {
                return targetRow[i].item;
            }
        }
        return null; // Si el mouse está a la derecha del último ítem, insertar al final de la fila
    }
    return null; // Por defecto, insertar al final del contenedor
}

function handleDrop(e)
{
    e.preventDefault();
    if (!draggedElement) return;

    const target = e.target;
    const isSelector = target.id === 'selector-items';
    const dropZone = isSelector ? target : target.closest('.row')?.querySelector('.drop-zone');

    if (!dropZone) return;

    const placeholderInZone = dropZone.querySelector('.preview-placeholder'); // Reordenamiento dentro de los tiers
    if (placeholderInZone)
    {
        const newContainer = isSelector ? document.createElement('div') : sourceContainer;
        if(isSelector)
        {
            newContainer.className = 'item-container';
            const tooltip = document.createElement('span');
            tooltip.className = 'item-tooltip';
            tooltip.textContent = draggedElement.alt || draggedElement.title || 'Anime';
            newContainer.appendChild(draggedElement);
            newContainer.appendChild(tooltip);
        }
        const afterElement = dropZone.querySelector('.placeholder-target');
        dropZone.insertBefore(isSelector ? newContainer : draggedElement.parentNode, afterElement || placeholderInZone);
        placeholderInZone.remove();
    }
    draggedElement.classList.remove('dragging');
    draggedElement.style.opacity = "1";
    $$('.drag-over').forEach(el => el.classList.remove('drag-over'));
    $$('.placeholder-target').forEach(el => el.classList.remove('placeholder-target'));
}

function handleDragEnter(e)
{
    e.preventDefault();
    const target = e.currentTarget;

    if (target.classList.contains('drop-zone') || target === $('#selector-items'))
    {
        target.classList.add('drag-over');

        if (target.classList.contains('drop-zone')) {
            target.closest('.row').classList.add('drag-over');
        }
    }
}

function handleDragLeave(e) 
{
    e.preventDefault();
    const target = e.currentTarget;

    if (target.classList.contains('drop-zone') || target === $('#selector-items'))
    {
        target.classList.remove('drag-over');

        if (target.classList.contains('drop-zone'))
        {
            target.closest('.row').classList.remove('drag-over');
        }
    }
}

function setupDragAndDrop()
{
    const rows = $$('.tier .row');
    const itemsSection = $('#selector-items');

    rows.forEach(row =>
    {
        if (!row.querySelector('.drop-zone'))
        {
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
        if (e.target.classList.contains('item-image'))
        {
            handleDragStart(e);
        }
    });

    document.addEventListener('dragend', (e) => {
        if (e.target.classList.contains('item-image'))
        {
            handleDragEnd(e);
        }
    });
}

async function getTopAnime(limit = 100)
{
    let animes = [];
    const totalPages = Math.ceil(limit / 25);

    try
    {
        for (let i = 1; i <= totalPages; i++)
        {
            const delay = Math.min(1000, i * 300);
            await new Promise(resolve => setTimeout(resolve, delay));

            const response = await fetch(`https://api.jikan.moe/v4/top/anime?page=${i}`);

            if (response.status === 429)
            {
                await new Promise(resolve => setTimeout(resolve, 2000));
                i--;
                continue;
            }
            const data = await response.json();
            animes = animes.concat(data.data);
        }

        return animes.slice(0, limit).map(anime =>
        ({
            title: anime.title,
            image: anime.images.jpg.image_url
        }));
    }
    catch (error)
    {
        console.error("Error al obtener los animes:", error);
        return [];
    }
}

async function showRandomAnimes(count = 15)
{
    const container = $('#selector-items');
    container.innerHTML = "<p>Seleccionando animes aleatoriamente...</p>";

    const existingAnimes = getExistingAnimes();

    const allAnimes = await getTopAnime(500); //Top del cual se eligen los animes
    const availableAnimes = allAnimes.filter(anime => !existingAnimes.includes(anime.title));

    if (availableAnimes.length === 0)  // Verificar si hay suficientes animes disponibles
    {
        showCustomAlert("¡Máximo número de animes añadidos!")
        container.innerHTML = "";
        return;
    }

    const adjustedCount = Math.min(count, availableAnimes.length);

    if(adjustedCount < count)
    {
        showCustomAlert(`Solo quedan ${availableAnimes.length} animes disponibles. Mostrando ${adjustedCount}.`);
    }

    const randomAnimes = availableAnimes
        .sort(() => 0.5 - Math.random())
        .slice(0, adjustedCount);

    container.innerHTML = "";
    randomAnimes.forEach(anime =>
    {
        createAnimeItem(anime, container);
    });

    setupDragAndDrop();
}

function getExistingAnimes()
{
    const existing = [];
    document.querySelectorAll('.tier .item-image').forEach(img =>
    {
        if(img.alt) existing.push(img.alt);
    });
    return existing;
}

function createAnimeItem(anime, container)
{
    const imgContainer = document.createElement("div");
    imgContainer.className = "item-container";

    const img = document.createElement("img");
    img.src = anime.image;
    img.className = "item-image";
    img.draggable = true;
    img.alt = anime.title; // Usamos alt para identificar duplicados

    const tooltip = document.createElement("span");
    tooltip.className = "item-tooltip";
    tooltip.textContent = anime.title;

    imgContainer.appendChild(img);
    imgContainer.appendChild(tooltip);
    container.appendChild(imgContainer);
}

document.addEventListener('DOMContentLoaded', () =>
{
    const applyBtn = document.getElementById('apply-count');
    const animeCountInput = document.getElementById('anime-count');
    const resetBtn = document.getElementById('reset-btn');
    
    showRandomAnimes(parseInt(animeCountInput.value)); // Carga inicial con valor por defecto
    
    applyBtn.addEventListener('click', () => {
        const count = parseInt(animeCountInput.value);

        if(count < 5 || count > 30 || isNaN(count))
        {
            showToast('Ingresa un número entre 5 y 30'); 
            animeCountInput.value = 10;
            animeCountInput.focus();
            return; // Detiene la ejecución si hay error
        }

        const existingCount = getExistingAnimes().length; // Mensaje si hay muchos duplicados
        if (existingCount > 100) { // Si ya hay 100+ animes en tiers
        if (!confirm(`Ya tienes ${existingCount} animes en los tiers. ¿Seguro quieres agregar más?`))
        {
            return;
        }
    }
        showRandomAnimes(count); // Si pasa la validación, ejecuta la función principal
    });


    function resetTiers()
    {
        const selectorItems = document.getElementById('selector-items');
        const allItems = document.querySelectorAll('.tier .item-container');

        if(allItems.length === 0)
        {
            showCustomAlert('No hay animes en los tiers para reiniciar');
            return;
        }

        allItems.forEach(item => // Mover cada item de vuelta al selector
        {
            selectorItems.appendChild(item);
        });

        showCustomAlert('¡Tiers reiniciados!');
    }
        
    resetBtn.addEventListener('click', resetTiers); // Evento para el botón de reinicio

    animeCountInput.addEventListener('input', () => // Validación mientras escribe
        {
            let value = parseInt(animeCountInput.value);
            if(isNaN(value)) value = 10;
            animeCountInput.value = Math.max(5, Math.min(30, value));
        
        });

    function captureTiers()
    {
        const tierSection = document.querySelector('.tier');
        
        html2canvas(tierSection, {
            backgroundColor: '#111', 
            scale: 2, 
            logging: false, // Desactiva logs en consola
            allowTaint: true,
            useCORS: true 
        }).then(canvas =>
        {
            const link = document.createElement('a'); 
            link.download = 'mi-tier-de-animes.png';
            link.href = canvas.toDataURL('image/png');
            link.click();
            
            showCustomAlert('¡Imagen guardada!'); 
        }).catch(err => {
            console.error('Error al capturar:', err);
            showCustomAlert('Error al guardar la imagen');
        });
    }

    // Evento para el botón de captura
    document.getElementById('capture-btn').addEventListener('click', captureTiers);
    });

function showCustomAlert(message)
{
    const alert = $('#custom-alert');
    alert.textContent = message;
    alert.classList.add('show');
    
    setTimeout(() =>
    {
        alert.classList.remove('show');
    }, 3000);
}