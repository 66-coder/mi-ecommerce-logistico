const AIRTABLE_TOKEN = "patGZFGpijZZ2WsNe.07ee819c0003ae5426f333810cf88784a57f0d875ece63a709e2323128ec7c53"; 
const BASE_ID = "appZ3owVzxMEYjUKh"; 

// 1. CARGA PERMANENTE DE CONTACTOS DESDE AIRTABLE
async function cargarContactos() {
  try {
    const response = await fetch(`https://api.airtable.com/v0/${BASE_ID}/Contactos`, {
      headers: { 
        'Authorization': `Bearer ${AIRTABLE_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Error HTTP: ${response.status} - No se pudo conectar a la tabla Contactos.`);
    }

    const data = await response.json();
    const shipperSelect = document.getElementById('shipperSelect');
    const consigneeSelect = document.getElementById('consigneeSelect');

    shipperSelect.innerHTML = '<option value="">Seleccione un Shipper</option>';
    consigneeSelect.innerHTML = '<option value="">Seleccione un Consignee</option>';

    data.records.forEach(record => {
      // Verificamos que el campo Name exista en el registro
      const nombreEmpresa = record.fields.Name || "Empresa sin nombre";
      const recordId = record.id;

      const option = `<option value="${recordId}">${nombreEmpresa}</option>`;
      shipperSelect.innerHTML += option;
      consigneeSelect.innerHTML += option;
    });

  } catch (error) {
    console.error("Falla en la carga permanente:", error);
    document.getElementById('statusMessage').textContent = "Aviso: Verificando permisos de la base de datos...";
    document.getElementById('statusMessage').style.color = "orange";
  }
}

// Ejecutar la conexión permanente al cargar la ventana
window.onload = cargarContactos;

// 2. GUARDADO DEFINITIVO DE ENVÍOS Y VINCULACIONES
document.getElementById('shippingForm').addEventListener('submit', async function(e) {
  e.preventDefault();
  
  const blValue = document.getElementById('blNumber').value;
  const shipperId = document.getElementById('shipperSelect').value;
  const consigneeId = document.getElementById('consigneeSelect').value;
  const statusMsg = document.getElementById('statusMessage');

  if (!shipperId || !consigneeId) {
    statusMsg.textContent = "Por favor seleccione un Shipper y un Consignee.";
    statusMsg.style.color = "red";
    return;
  }

  statusMsg.textContent = "Guardando en base de datos...";
  statusMsg.style.color = "#0066cc";

  try {
    const response = await fetch(`https://api.airtable.com/v0/${BASE_ID}/Envios`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${AIRTABLE_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        fields: {
          "Numero de BL": blValue,
          "Shipper": [shipperId],     // Relación relacional nativa de Airtable
          "Consignee": [consigneeId]  // Relación relacional nativa de Airtable
        }
      })
    });

    if (response.ok) {
      statusMsg.textContent = "¡Registro guardado y vinculado permanentemente!";
      statusMsg.style.color = "green";
      document.getElementById('shippingForm').reset();
      cargarContactos();
    } else {
      const errorData = await response.json();
      console.error("Error de Airtable al guardar:", errorData);
      statusMsg.textContent = "Error al guardar el envío. Revisa la consola.";
      statusMsg.style.color = "red";
    }
  } catch (error) {
    console.error("Error crítico de red:", error);
    statusMsg.textContent = "Error de red al intentar conectar con el servidor.";
    statusMsg.style.color = "red";
  }
});
