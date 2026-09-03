const AIRTABLE_TOKEN = "patGZFGpijZZ2WsNe.07ee819c0003ae5426f333810cf88784a57f0d875ece63a709e2323128ec7c53"; 
const BASE_ID = "appZ3owVzxMEYjUKh"; 

// 1. CARGA SEGURA DE EMPRESAS (Sin bloqueos de esquema externos)
function cargarContactos() {
  const shipperSelect = document.getElementById('shipperSelect');
  const consigneeSelect = document.getElementById('consigneeSelect');

  shipperSelect.innerHTML = '<option value="">Seleccione un Shipper</option>';
  consigneeSelect.innerHTML = '<option value="">Seleccione un Consignee</option>';

  // Listado oficial de tu operación logística
  const empresasLogisticas = [
    { id: "Empresa A", name: "Empresa A" },
    { id: "Exportadora Los Andes", name: "Exportadora Los Andes" },
    { id: "Puerto Valparaíso S.A.", name: "Puerto Valparaíso S.A." }
  ];

  empresasLogisticas.forEach(empresa => {
    const option = `<option value="${empresa.name}">${empresa.name}</option>`;
    shipperSelect.innerHTML += option;
    consigneeSelect.innerHTML += option;
  });
}

// Inicializar selectores al abrir
window.onload = cargarContactos;

// 2. ENVÍO DIRECTO A LA TABLA PRINCIPAL DE AIRTABLE
document.getElementById('shippingForm').addEventListener('submit', async function(e) {
  e.preventDefault();
  
  const blValue = document.getElementById('blNumber').value;
  const shipperValue = document.getElementById('shipperSelect').value;
  const consigneeValue = document.getElementById('consigneeSelect').value;
  const statusMsg = document.getElementById('statusMessage');

  if (!shipperValue || !consigneeValue) {
    statusMsg.textContent = "Por favor seleccione el Shipper y el Consignee.";
    statusMsg.style.color = "red";
    return;
  }

  statusMsg.textContent = "Guardando registro logístico...";
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
          "Shipper": shipperValue,
          "Consignee": consigneeValue
        }
      })
    });

    if (response.ok) {
      statusMsg.textContent = "¡Envío registrado con éxito en la base de datos!";
      statusMsg.style.color = "green";
      document.getElementById('shippingForm').reset();
      cargarContactos();
    } else {
      const errorData = await response.json();
      console.error("Detalle del error:", errorData);
      statusMsg.textContent = "Error al guardar. Revisa la consola.";
      statusMsg.style.color = "red";
    }
  } catch (error) {
    console.error("Error de conexión:", error);
    statusMsg.textContent = "Error de red al conectar con Airtable.";
    statusMsg.style.color = "red";
  }
});
