const AIRTABLE_TOKEN = "pat26xWPuleRPN9fx.0501fa7b6f95fbcb4d7ed700e22a8d57d688b0b82ca2317c5466be71b3692748"; 
const BASE_ID = "appZ3owVzxMEYjUKh"; 

console.log("Token actual:", AIRTABLE_TOKEN); // <-- Agrega esta línea temporalmente
// 1. CARGAR LOS CONTACTOS EN LOS SELECTORES
async function cargarContactos() {
  try {
    const response = await fetch(`https://api.airtable.com/v0/${BASE_ID}/Contactos`, {
      headers: { 'Authorization': `Bearer ${AIRTABLE_TOKEN}` }
    });
    
    if (!response.ok) {
      console.error("Error en la respuesta de Airtable:", response.status);
      return;
    }

    const data = await response.json();

    const shipperSelect = document.getElementById('shipperSelect');
    const consigneeSelect = document.getElementById('consigneeSelect');

    shipperSelect.innerHTML = '<option value="">Seleccione un Shipper</option>';
    consigneeSelect.innerHTML = '<option value="">Seleccione un Consignee</option>';

    data.records.forEach(record => {
      const nombreEmpresa = record.fields.Name || "Sin Nombre";
      const recordId = record.id;

      const option = `<option value="${recordId}">${nombreEmpresa}</option>`;
      shipperSelect.innerHTML += option;
      consigneeSelect.innerHTML += option;
    });

  } catch (error) {
    console.error("Error al cargar contactos:", error);
  }
}

cargarContactos();

// 2. GUARDAR EL NUEVO ENVÍO
document.getElementById('shippingForm').addEventListener('submit', async function(e) {
  e.preventDefault();
  
  const blValue = document.getElementById('blNumber').value;
  const shipperId = document.getElementById('shipperSelect').value;
  const consigneeId = document.getElementById('consigneeSelect').value;
  const statusMsg = document.getElementById('statusMessage');

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
