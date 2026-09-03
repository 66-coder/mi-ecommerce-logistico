const AIRTABLE_TOKEN = "pat26xWPuleRPN9fx"; 
const BASE_ID = "appZ3owVzxMEyjUKh"; 

// 1. FUNCIÓN PARA CARGAR LOS CONTACTOS AL ABRIR LA PÁGINA
async function cargarContactos() {
  try {
    const response = await fetch(`https://api.airtable.com/v0/${BASE_ID}/Contactos`, {
      headers: { 'Authorization': `Bearer ${AIRTABLE_TOKEN}` }
    });
    const data = await response.json();

    const shipperSelect = document.getElementById('shipperSelect');
    const consigneeSelect = document.getElementById('consigneeSelect');

    shipperSelect.innerHTML = '<option value="">Seleccione un Shipper</option>';
    consigneeSelect.innerHTML = '<option value="">Seleccione un Consignee</option>';

    data.records.forEach(record => {
      const nombreEmpresa = record.fields.Name; // Asegúrate de que tu columna en Airtable se llame 'Name'
      const recordId = record.id;

      // Creamos una opción HTML usando el ID único del registro de Airtable
      const option = `<option value="${recordId}">${nombreEmpresa}</option>`;
      
      shipperSelect.innerHTML += option;
      consigneeSelect.innerHTML += option;
    });

  } catch (error) {
    console.error("Error al cargar contactos:", error);
  }
}

// Ejecutar la función de carga al iniciar la página
cargarContactos();

// 2. FUNCIÓN PARA GUARDAR EL NUEVO ENVÍO
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
          "Shipper": [shipperId],     // Airtable exige un arreglo [] para los campos vinculados
          "Consignee": [consigneeId]  // Airtable exige un arreglo [] para los campos vinculados
        }
      })
    });

    if (response.ok) {
      statusMsg.textContent = "¡Envío registrado y vinculado con éxito!";
      statusMsg.style.color = "green";
      document.getElementById('shippingForm').reset();
      cargarContactos(); // Recarga los selectores
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