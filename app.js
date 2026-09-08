const AIRTABLE_TOKEN = "patduhWO9m2fvP2HS.2c2d2c49a468a681c9815eb917033be5dce3b0be3e643418fa9b5979f414fdbb";
const BASE_ID = "appZ3owVzxMEyjUKh";
const TABLE_ID_CONTACTOS = "tblW3ULDFeiHdkvqb";
const TABLE_ID_REGISTROS = "tblSlljdVyt77bp7E";

// Guardaremos el mapa ID -> Nombre de empresa aquí
const contactosMap = {};

// 1. CARGAR EMPRESAS Y GUARDAR MAPA DE NOMBRES
async function cargarContactos() {
  const shipperSelect = document.getElementById('shipperSelect');
  const consigneeSelect = document.getElementById('consigneeSelect');

  shipperSelect.innerHTML = '<option value="">Seleccione un Shipper</option>';
  consigneeSelect.innerHTML = '<option value="">Seleccione un Consignee</option>';

  try {
    const response = await fetch(`https://api.airtable.com/v0/${BASE_ID}/${TABLE_ID_CONTACTOS}`, {
      headers: { 'Authorization': `Bearer ${AIRTABLE_TOKEN}` }
    });

    if (!response.ok) throw new Error("Error al conectar con Contactos");

    const data = await response.json();

    if (data.records && data.records.length > 0) {
      data.records.forEach(record => {
        const nombreEmpresa = record.fields.Name;
        if (nombreEmpresa) {
          // Guardamos el ID de Airtable mapeado a su nombre real
          contactosMap[record.id] = nombreEmpresa;

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

// Auxiliar para convertir recXXXXXXXX a Nombre o devolver la cadena tal cual
function obtenerNombreEmpresa(valor) {
  if (!valor) return "-";
  if (Array.isArray(valor)) {
    return valor.map(v => contactosMap[v] || v).join(', ');
  }
  return contactosMap[valor] || valor;
}

// 2. CARGAR REGISTROS EMITIDOS
async function cargarRegistros() {
  const tablaBody = document.getElementById('tablaRegistrosBody');
  if (!tablaBody) return;

  try {
    const response = await fetch(`https://api.airtable.com/v0/${BASE_ID}/${TABLE_ID_REGISTROS}`, {
      headers: { 'Authorization': `Bearer ${AIRTABLE_TOKEN}` }
    });

    if (!response.ok) throw new Error("Error al obtener los registros.");

    const data = await response.json();
    tablaBody.innerHTML = '';

    if (data.records && data.records.length > 0) {
      data.records.forEach(record => {
        const bl = record.fields["Numero de BL"] || "S/N";
        
        // Traducimos los IDs o textos
        const shipper = obtenerNombreEmpresa(record.fields["Shipper"]);
        const consignee = obtenerNombreEmpresa(record.fields["Consignee"]);

        tablaBody.innerHTML += `
          <tr>
            <td>${bl}</td>
            <td>${shipper}</td>
            <td>${consignee}</td>
          </tr>
        `;
      });
    } else {
      tablaBody.innerHTML = '<tr><td colspan="3" style="text-align: center;">No hay envíos registrados.</td></tr>';
    }
  } catch (error) {
    console.error("Error al cargar la tabla:", error);
    tablaBody.innerHTML = '<tr><td colspan="3" style="text-align: center; color: red;">Error al cargar registros.</td></tr>';
  }
}

// Cargar en orden: primero contactos, luego registros
window.onload = async function() {
  await cargarContactos();
  await cargarRegistros();
};

// 3. GUARDAR NUEVO ENVÍO DIRECTAMENTE
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
      
      await cargarRegistros();
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
