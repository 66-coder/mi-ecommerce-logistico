const AIRTABLE_TOKEN = "patduhWO9m2fvP2HS.2c2d2c49a468a681c9815eb917033be5dce3b0be3e643418fa9b5979f414fdbb";
const BASE_ID = "appZ3owVzxMEyjUKh";
const TABLE_ID_CONTACTOS = "tblW3ULDFeiHdkvqb";
const TABLE_ID_REGISTROS = "tblSlljdVyt77bp7E";

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
        const nombreEmpresa = record.fields.Name;
        if (nombreEmpresa) {
          const option = `<option value="${nombreEmpresa}">${nombreEmpresa}</option>`;
          shipperSelect.innerHTML += option;
          consigneeSelect.innerHTML += option;
        }
      });
    }
  } catch (error) {
    console.error("Error al cargar empresas:", error);
    const empresaPrueba = '<option value="Empresa A">Empresa A (Modo Seguro)</option>';
    shipperSelect.innerHTML += empresaPrueba;
    consigneeSelect.innerHTML += empresaPrueba;
  }
}

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
        typecast: true
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
