// Configuración de la API
const API_URL = "https://api-inference.huggingface.co/models/black-forest-labs/FLUX.1-schnell";

// Estado de la aplicación
let isGenerating = false;
let currentImageUrl = null;

// Función principal para generar imagen
async function generateImage() {
    if (isGenerating) return;

    // Obtener valores del formulario
    const apiKey = document.getElementById('apiKey').value.trim();
    const prompt = document.getElementById('prompt').value.trim();
    const width = parseInt(document.getElementById('width').value);
    const height = parseInt(document.getElementById('height').value);
    const steps = parseInt(document.getElementById('steps').value);
    const seedInput = document.getElementById('seed').value;
    
    // Validaciones
    if (!apiKey) {
        showError('Por favor, ingresa tu token de API de Hugging Face');
        return;
    }
    
    if (!prompt) {
        showError('Por favor, describe la imagen que quieres generar');
        return;
    }

    // Preparar UI para generación
    isGenerating = true;
    const generateBtn = document.getElementById('generateBtn');
    const imageContainer = document.getElementById('imageContainer');
    const messageContainer = document.getElementById('messageContainer');
    
    generateBtn.classList.add('loading');
    generateBtn.disabled = true;
    generateBtn.textContent = 'Generando...';
    imageContainer.innerHTML = '<div class="placeholder">🎨 Creando tu imagen... Esto puede tomar unos segundos...</div>';
    messageContainer.innerHTML = '';

    try {
        // Preparar los parámetros
        const requestBody = {
            inputs: prompt,
            parameters: {
                width: width,
                height: height,
                num_inference_steps: steps,
                guidance_scale: 0, // FLUX.1-schnell no usa guidance scale
            }
        };

        // Añadir semilla si se especificó
        if (seedInput) {
            requestBody.parameters.seed = parseInt(seedInput);
        }

        console.log('Enviando solicitud a Hugging Face API...');
        console.log('Parámetros:', requestBody);

        // Realizar petición a la API
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody)
        });

        // Verificar respuesta
        if (!response.ok) {
            const errorData = await response.text();
            console.error('Error de API:', errorData);
            
            if (response.status === 401) {
                throw new Error('Token de API inválido. Por favor, verifica tu token.');
            } else if (response.status === 503) {
                throw new Error('El modelo se está cargando. Por favor, intenta de nuevo en unos segundos.');
            } else if (response.status === 429) {
                throw new Error('Límite de tasa excedido. Por favor, espera un momento antes de intentar de nuevo.');
            } else {
                throw new Error(`Error del servidor: ${response.status} - ${errorData}`);
            }
        }

        // Obtener la imagen como blob
        const blob = await response.blob();
        
        // Crear URL de la imagen
        currentImageUrl = URL.createObjectURL(blob);
        
        // Mostrar la imagen
        imageContainer.innerHTML = `
            <div>
                <img src="${currentImageUrl}" alt="Imagen generada">
            </div>
        `;
        
        // Añadir botón de descarga
        const downloadBtn = document.createElement('a');
        downloadBtn.href = currentImageUrl;
        downloadBtn.download = `flux-image-${Date.now()}.png`;
        downloadBtn.className = 'download-btn';
        downloadBtn.textContent = '⬇️ Descargar Imagen';
        messageContainer.innerHTML = '';
        messageContainer.appendChild(downloadBtn);
        
        showSuccess('¡Imagen generada exitosamente!');
        
        console.log('Imagen generada con éxito');

    } catch (error) {
        console.error('Error al generar imagen:', error);
        imageContainer.innerHTML = '<div class="placeholder">❌ Error al generar la imagen</div>';
        showError(error.message || 'Ocurrió un error al generar la imagen. Por favor, intenta de nuevo.');
    } finally {
        // Restaurar botón
        isGenerating = false;
        generateBtn.classList.remove('loading');
        generateBtn.disabled = false;
        generateBtn.textContent = '🚀 Generar Imagen';
    }
}

// Función para mostrar errores
function showError(message) {
    const messageContainer = document.getElementById('messageContainer');
    messageContainer.innerHTML = `<div class="error-message">⚠️ ${message}</div>`;
}

// Función para mostrar éxito
function showSuccess(message) {
    const messageContainer = document.getElementById('messageContainer');
    const existingContent = messageContainer.innerHTML;
    messageContainer.innerHTML = `<div class="success-message">✅ ${message}</div>` + existingContent;
    
    // Ocultar mensaje después de 5 segundos
    setTimeout(() => {
        const successMsg = messageContainer.querySelector('.success-message');
        if (successMsg) {
            successMsg.style.transition = 'opacity 0.5s';
            successMsg.style.opacity = '0';
            setTimeout(() => successMsg.remove(), 500);
        }
    }, 5000);
}

// Event listeners
document.getElementById('prompt').addEventListener('keypress', function(e) {
    if (e.key === 'Enter' && e.ctrlKey) {
        generateImage();
    }
});

// Cargar token guardado si existe
window.addEventListener('load', function() {
    const savedToken = localStorage.getItem('hf_api_token');
    if (savedToken) {
        document.getElementById('apiKey').value = savedToken;
    }
});

// Guardar token cuando se ingresa (opcional, por conveniencia)
document.getElementById('apiKey').addEventListener('change', function() {
    if (this.value && confirm('¿Deseas guardar el token para futuras sesiones? (Se guardará localmente en tu navegador)')) {
        localStorage.setItem('hf_api_token', this.value);
    }
});

// Ejemplos de prompts
const examplePrompts = [
    "Un castillo flotante en las nubes al atardecer, estilo fantasía épica, colores vibrantes",
    "Retrato de un robot cyberpunk con ojos brillantes, estilo futurista, neón, 8k",
    "Un bosque mágico con hongos luminiscentes, atmósfera misteriosa, luz de luna",
    "Una ciudad submarina con arquitectura art nouveau, rayos de luz solar atravesando el agua",
    "Un dragón de cristal en una cueva de diamantes, reflejos prismáticos, ultra detallado"
];

// Añadir botón para prompt aleatorio
document.getElementById('prompt').addEventListener('dblclick', function() {
    const randomPrompt = examplePrompts[Math.floor(Math.random() * examplePrompts.length)];
    this.value = randomPrompt;
    this.style.animation = 'pulse 0.5s';
    setTimeout(() => this.style.animation = '', 500);
});

console.log('🎨 Generador de Imágenes FLUX.1-schnell iniciado');
console.log('📝 Doble clic en el campo de prompt para ver un ejemplo');