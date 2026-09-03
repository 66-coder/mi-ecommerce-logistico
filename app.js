const AIRTABLE_TOKEN = "patGZFGpijZZ2WsNe.07ee819c0003ae5426f333810cf88784a57f0d875ece63a709e2323128ec7c53"; 
const BASE_ID = "appZ3owVzxMEYjUKh"; 

// 1. CARGAR EMPRESAS 100% DESDE AIRTABLE (Sin datos falsos en el código)
async function cargarContactos() {
  const shipperSelect = document.getElementById('shipperSelect');
  const consigneeSelect = document.getElementById('consigneeSelect');

  // Dejamos los selectores con la opción inicial vacía de guía
  shipperSelect.innerHTML = '<option value="">Seleccione un Shipper</option>';
  consigneeSelect.innerHTML = '<option value="">Seleccione un Consignee</option>';

  try {
    const response = await fetch(`https://api.airtable.com/v0/${BASE_ID}/Contactos`, {
      headers: { 'Authorization': `Bearer ${AIRTABLE_TOKEN}` }
    });

    if (!response.ok) {
      throw new Error(`Error al conectar con la tabla Contactos (Código: ${response.status})`);
    }

    const data = await response.json();

    // Si Airtable tiene registros, los recorremos y los agregamos al select
    if (data.records && data.records.length > 0) {
      data.records.forEach(record => {
        const nombreEmpresa = record.fields.Name || "Sin Nombre";
        const recordId = record.id;

        const option = `<option value="${recordId}">${nombreEmpresa}</option>`;
        shipperSelect.innerHTML += option;
        consigneeSelect.innerHTML += option;
      });
    } else {
      // Si la tabla está vacía, opcionalmente podemos dejar una opción informativa
      shipperSelect.innerHTML = '<option value="">No hay empresas registradas</option>';
      consigneeSelect.innerHTML = '<option value="">No hay empresas registradas</option>';
    }

  } catch (error) {
    console.error("Error al cargar contactos:", error);
  }
}

// Ejecutar al cargar la página
window.onload = cargarContactos;

// 2. GUARDAR EL NUEVO ENVÍO VINCULADO EN AIRTABLE
document.getElementById('shippingForm').addEventListener('submit', async function(e) {
  e.preventDefault();
  
  const blValue = document.getElementById('blNumber').value;
  const shipperId = document.getElementById('shipperSelect').value;
  const consigneeId = document.getElementById('consigneeSelect').value;
  const statusMsg = document.getElementById('statusMessage');

  if (!shipperId || !consigneeId) {
    statusMsg.textContent = "Seleccione un Shipper y un Consignee válidos.";
    statusMsg.style.color = "red";
    return;
  }

  statusMsg.textContent = "Guardando envío...";
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
          "Shipper": [shipperId],
          "Consignee": [consigneeId]
        }
      })
    });

    if (response.ok) {
      statusMsg.textContent = "¡Envío registrado y vinculado con éxito!";
      statusMsg.style.color = "green";
      document.getElementById('shippingForm').reset();
      cargarContactos();
    } else {
      const errorData = await response.json();
      console.error(errorData);
      statusMsg.textContent = "Error al guardar. Revisa la consola.";
      statusMsg.style.color = "red";
    }
  } catch (error) {
    console.error(error);
    statusMsg.textContent = "Error de red.";
    statusMsg.style.color = "red";
  }
});
