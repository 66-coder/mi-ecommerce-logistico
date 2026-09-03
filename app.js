const AIRTABLE_TOKEN = "patH2xP7hxIs6njrP.89785e11ee50747230c7561aa42bc93e540d448cd3e9964a2ce8a6c9301226cf"; 
const BASE_ID = "appZ3owVzxMEYjUKh"; 

// 1. CARGAR EMPRESAS DESDE LA TABLA 'Contactos'
async function cargarContactos() {
  const shipperSelect = document.getElementById('shipperSelect');
  const consigneeSelect = document.getElementById('consigneeSelect');

  shipperSelect.innerHTML = '<option value="">Seleccione un Shipper</option>';
  consigneeSelect.innerHTML = '<option value="">Seleccione un Consignee</option>';

  try {
    const response = await fetch(`https://api.airtable.com/v0/${BASE_ID}/Contactos`, {
      headers: { 'Authorization': `Bearer ${AIRTABLE_TOKEN}` }
    });

    if (!response.ok) {
      throw new Error(`Error al conectar con Contactos (Código: ${response.status})`);
    }

    const data = await response.json();

    if (data.records && data.records.length > 0) {
      data.records.forEach(record => {
        const nombreEmpresa = record.fields.Name || "Sin Nombre";
        const option = `<option value="${nombreEmpresa}">${nombreEmpresa}</option>`;
        shipperSelect.innerHTML += option;
        consigneeSelect.innerHTML += option;
      });
    }
  } catch (error) {
    console.error("Aviso de lectura en Contactos:", error);
    // Fallback temporal para que los selectores no queden vacíos si la API se pone estricta
    const empresaFallback = '<option value="Empresa A">Empresa A</option>';
    shipperSelect.innerHTML += empresaFallback;
    consigneeSelect.innerHTML += empresaFallback;
  }
}

window.onload = cargarContactos;

// 2. GUARDAR NUEVO ENVÍO EN LA TABLA 'Registros'
document.getElementById('shippingForm').addEventListener('submit', async function(e) {
  e.preventDefault();
  
  const blValue = document.getElementById('blNumber').value;
  const shipperValue = document.getElementById('shipperSelect').value;
  const consigneeValue = document.getElementById('consigneeSelect').value;
  const statusMsg = document.getElementById('statusMessage');

  if (!blValue || !shipperValue || !consigneeValue) {
    statusMsg.textContent = "Por favor complete todos los campos.";
    statusMsg.style.color = "red";
    return;
  }

  statusMsg.textContent = "Guardando envío...";
  statusMsg.style.color = "#0066cc";

  try {
    const response = await fetch(`https://api.airtable.com/v0/${BASE_ID}/Registros`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${AIRTABLE_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        fields: {
          "Numero de BL": blValue,
          "Shipper": shipperValue,
          "Consignee": consigneeValue
        }
      })
    });

    if (response.ok) {
      statusMsg.textContent = "¡Envío registrado con éxito!";
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
