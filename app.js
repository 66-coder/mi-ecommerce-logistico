const AIRTABLE_TOKEN = "patH2xP7hxIs6njrP.2116e716eb3ba5d01b7da43427f3b74f4901468d3211a14d46aac8c65313d136"; 
const BASE_ID = "appZ3owVzxMEYjUKh"; 
const TABLE_ID_CONTACTOS = "tblW3ULDFeiHdkvqb"; // Reemplaza con el tbl... de tu tabla Contactos
const TABLE_ID_REGISTROS = "tblSlljdVyt77bp7E"; // ID de tu tabla Registros

// 1. CARGAR EMPRESAS DINÁMICAMENTE DESDE LA TABLA 'Contactos'
async function cargarContactos() {
  const shipperSelect = document.getElementById('shipperSelect');
  const consigneeSelect = document.getElementById('consigneeSelect');

  shipperSelect.innerHTML = '<option value="">Seleccione un Shipper</option>';
  consigneeSelect.innerHTML = '<option value="">Seleccione un Consignee</option>';

  try {
    const response = await fetch(`https://api.airtable.com/v0/${BASE_ID}/${TABLE_ID_CONTACTOS}`, {
      headers: { 'Authorization': `Bearer ${AIRTABLE_TOKEN}` }
    });

    if (!response.ok) {
      throw new Error(`Error al conectar con Contactos (Código: ${response.status})`);
    }

    const data = await response.json();

    if (data.records && data.records.length > 0) {
      data.records.forEach(record => {
        const nombreEmpresa = record.fields.Name; // Asegúrate de que tu columna en Airtable se llame 'Name'
        if (nombreEmpresa) {
          const option = `<option value="${nombreEmpresa}">${nombreEmpresa}</option>`;
          shipperSelect.innerHTML += option;
          consigneeSelect.innerHTML += option;
        }
      });
    }
  } catch (error) {
    console.error("Error al cargar empresas:", error);
    // Fallback por si acaso la red falla
    const empresaPrueba = '<option value="Empresa A">Empresa A (Modo Seguro)</option>';
    shipperSelect.innerHTML += empresaPrueba;
    consigneeSelect.innerHTML += empresaPrueba;
  }
}

// Cargar los contactos automáticamente al abrir la página
window.onload = cargarContactos;

// 2. GUARDAR NUEVO ENVÍO DIRECTAMENTE EN LA TABLA 'Registros'
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
    const response = await fetch(`https://api.airtable.com/v0/${BASE_ID}/${TABLE_ID_REGISTROS}`, {
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
        },
        typecast: true // Obliga a Airtable a aceptar y vincular el texto perfectamente
      })
    });

    if (response.ok) {
      statusMsg.textContent = "¡Envío registrado con éxito!";
      statusMsg.style.color = "green";
      document.getElementById('shippingForm').reset();
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
