// =========================
// MAP
// =========================

let map = L.map('map', {
    zoomControl: false
}).setView([37.473, 49.458], 13);


// لایه نقشه اصلی
const lightMap = L.tileLayer(
    'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
    {
        maxZoom: 19,
        attribution: '&copy; OpenStreetMap contributors'
    }
).addTo(map);


// بارگذاری محدوده بندرانزلی
fetch("bandar_anzali.geojson")
    .then(response => {
        if (!response.ok) {
            throw new Error("خطا در بارگذاری محدوده بندرانزلی");
        }

        return response.json();
    })
    .then(data => {
        const border = L.geoJSON(data, {
            style: {
                color: "#ff3b30",
                weight: 2,
                opacity: 1,
                fillOpacity: 0
            }
        }).addTo(map);

        map.fitBounds(border.getBounds());
    })
    .catch(error => {
        console.error("خطا در بارگذاری محدوده:", error);
    });

// =========================
// VARIABLES
// =========================

let selectedLat = null;
let selectedLng = null;

let editingId = null;

let tempMarker = null;

let properties =
JSON.parse(
    localStorage.getItem("properties")
) || [];

let markers = [];

let selectingAgencyLocation = false;

let agencyLat = null;
let agencyLng = null;

let agencyMarkers = [];

let editingAgencyId = null;

let selectedImages = [];

let selectedImageIndex = 0;

let galleryImages = [];
let currentGalleryIndex = 0;


const savedProperties =
    localStorage.getItem("properties");

if(savedProperties){

    properties =
        JSON.parse(savedProperties);

}
function getPropertyIcon(type){

    if(type === "آپارتمان"){
        return apartmentIcon;
    }

    if(type === "ویلا"){
        return villaIcon;
    }

    if(type === "زمین"){
        return landIcon;
    }

    if(type === "مغازه"){
        return shopIcon;
    }

    if(type === "اداری"){
        return officeIcon;
    }

    return apartmentIcon;

}


let currentStep = 1;


function createMarker(color, icon){

    return L.divIcon({

        className: "",

        html: `
        <div class="custom-marker ${color}">
            <span>${icon}</span>
        </div>
        `,

        iconSize: [42, 42],
        iconAnchor: [21, 42],
        popupAnchor: [0, -42]

    });

}

const apartmentIcon = L.icon({
    iconUrl: "icons/apartment.png",
    iconSize: [60, 60],
    iconAnchor: [30, 60],
    popupAnchor: [0, -60]
});

const villaIcon = L.icon({
    iconUrl: "icons/villa.png",
    iconSize: [60, 60],
    iconAnchor: [30, 60],
    popupAnchor: [0, -60]
});

const landIcon = L.icon({
    iconUrl: "icons/land.png",
    iconSize: [60, 60],
    iconAnchor: [30, 60],
    popupAnchor: [0, -60]
});

const shopIcon = L.icon({
    iconUrl: "icons/shop.png",
    iconSize: [60, 60],
    iconAnchor: [30, 60],
    popupAnchor: [0, -60]
});

const officeIcon = L.icon({
    iconUrl: "icons/office.png",
    iconSize: [60, 60],
    iconAnchor: [30, 60],
    popupAnchor: [0, -60]
});

let propertyMarkers = [];

function formatPrice(price){

    if(!price){
        return "-";
    }

    return Number(price).toLocaleString("fa-IR");

}

function renderProperties(data = properties){

console.log("START");

markers.forEach(marker => {
    map.removeLayer(marker);
});

markers = [];


    data.forEach(function(property){

    if(
        !property ||
        property.lat === null ||
        property.lng === null
    ){
        return;
    }

//console.log(property.propertyType);

    const marker = L.marker(
        [property.lat, property.lng],
        {
            icon: getPropertyIcon(
                property.propertyType
            )
        }
    ).addTo(map);

    markers.push(marker);

    //console.log(property);

    marker.on("click", function () {
    if (window.innerWidth <= 768) {
        map.panTo(marker.getLatLng(), {
            animate: true
        });
    }
});

 



marker.bindPopup(`
    <div class="property-popup">

        <!-- بخش بالا: اطلاعات سمت راست، عکس سمت چپ -->
        <div class="popup-top">

            <div class="popup-main-info">

                <!-- سطر اول: نوع معامله -->
                <div class="popup-deal-row">

                    <span class="popup-deal deal-${property.dealType}">
                        ${
                            property.dealType === "sell" ? "فروش" :
                            property.dealType === "deposit" ? "رهن کامل" :
                            property.dealType === "rent" ? "اجاره" :
                            "رهن و اجاره"
                        }
                    </span>

                </div>

                <!-- سطر دوم: نوع ملک + عنوان -->
                <div class="popup-property-title-row">

                    <span class="popup-property-badge badge-${({
                        "apartment": "apartment",
                        "villa": "villa",
                        "land": "land",
                        "shop": "shop",
                        "office": "office",
                        "آپارتمان": "apartment",
                        "ویلا": "villa",
                        "زمین": "land",
                        "مغازه": "shop",
                        "اداری": "office"
                    })[property.propertyType] || "default"}">
                        ${
                            ({
                                "apartment": "آپارتمان",
                                "villa": "ویلا",
                                "land": "زمین",
                                "shop": "مغازه",
                                "office": "اداری",
                                "آپارتمان": "آپارتمان",
                                "ویلا": "ویلا",
                                "زمین": "زمین",
                                "مغازه": "مغازه",
                                "اداری": "اداری"
                            })[property.propertyType] || property.propertyType || ""
                        }
                    </span>

                    ${
                        property.title && property.title.trim()
                        ? `<span class="popup-title">${property.title.trim()}</span>`
                        : ""
                    }

                </div>

            </div>

            <!-- قاب عکس مربع سمت چپ -->
            <div class="popup-image-container">
                ${
                    property.images &&
                    property.images.length &&
                    property.images[0]
                    ? `
                        <img
                            src="${property.images[0]}"
                            class="popup-image"
                            alt="تصویر ملک"
                        >
                    `
                    : `
                        <div class="popup-no-image">
                           فاقد تصویر
                        </div>
                    `
                }
            </div>

        </div>

        <!-- آدرس -->
        <div class="popup-address">

            <img
                src="icons/location.svg"
                alt=""
                class="popup-location-icon"
            >

            <span>${property.address || "آدرس ثبت نشده"}</span>

        </div>


        <!-- مشخصات ملک -->
        <div class="popup-specs">

            <div class="popup-spec">
                <strong>${property.area || "—"}</strong>
                <span>متر مربع</span>
            </div>

            <div class="popup-spec">
                <strong>${property.rooms || "—"}</strong>
                <span>اتاق</span>
            </div>

            <div class="popup-spec">
                <strong>${property.year || "—"}</strong>
                <span>سال ساخت</span>
            </div>

        </div>

        <!-- قیمت‌ها -->
        <div class="popup-price-grid">

            ${
                property.dealType === "sell"
                ? `
                    <div class="popup-price-card">
                        <span>قیمت فروش</span>
                        <strong>${formatPrice(property.sellPrice)} تومان</strong>
                    </div>

                    <div class="popup-price-card">
                        <span>متری</span>
                        <strong>${formatPrice(property.pricePerMeter)} تومان</strong>
                    </div>
                `
                : property.dealType === "deposit"
                ? `
                    <div class="popup-price-card popup-price-full">
                        <span>رهن کامل</span>
                        <strong>${formatPrice(property.depositPrice)} تومان</strong>
                    </div>
                `
                : property.dealType === "rent"
                ? `
                    <div class="popup-price-card">
                        <span>ودیعه</span>
                        <strong>${formatPrice(property.rentDeposit)} تومان</strong>
                    </div>

                    <div class="popup-price-card">
                        <span>کرایه</span>
                        <strong>${formatPrice(property.rentPrice)} تومان</strong>
                    </div>
                `
                : `
                    <div class="popup-price-card">
                        <span>رهن</span>
                        <strong>${formatPrice(property.depositPrice)} تومان</strong>
                    </div>

                    <div class="popup-price-card">
                        <span>اجاره ماهانه</span>
                        <strong>${formatPrice(property.rentPrice)} تومان</strong>
                    </div>
                `
            }

        </div>

       
<!-- دکمه‌ها -->
<div class="popup-actions popup-actions-row">

    
<button
    class="details-btn"
    onclick="showPropertyDetails(${property.id})">
    <img
        src="icons/details.svg"
        alt=""
        class="popup-action-icon"
    >
    <span>جزئیات</span>
</button>


    <button
        class="edit-btn"
        onclick="editProperty(${property.id})">
        <img
            src="icons/edit.svg"
            alt=""
            class="popup-action-icon"
        >
        <span>ویرایش</span>
    </button>

    <button
        class="delete-btn"
        onclick="deleteProperty(${property.id})">
        <img
            src="icons/trash.svg"
            alt=""
            class="popup-action-icon"
        >
        <span>حذف</span>
    </button>

</div>

</div>
`);

marker.on("popupopen", function () {
    if (window.innerWidth <= 768) {
        document.body.classList.add("property-popup-open");

        const popupElement = marker.getPopup().getElement();
        if (!popupElement) return;

        const mapRect = map.getContainer().getBoundingClientRect();
        const popupRect = popupElement.getBoundingClientRect();

        const dx =
            popupRect.left + popupRect.width / 2 -
            (mapRect.left + mapRect.width / 2);

        const dy =
            popupRect.top + popupRect.height / 2 -
            (mapRect.top + mapRect.height / 2);

        map.panBy([dx, dy], { animate: true });
    }
});

marker.on("popupclose", function () {
    document.body.classList.remove("property-popup-open");
});

});

}

renderProperties();

const searchInput = document.getElementById("searchInput");

searchInput.addEventListener("input", function(){

    const q = this.value.trim().toLowerCase();

    if(q === ""){

        renderProperties(properties);
        return;
    }

   const filtered = properties.filter(property => {

    const searchText = [

        property.title,
        property.propertyType,
        property.dealType,
        property.description,
        property.address

    ]
    .join(" ")
    .toLowerCase();

    const query = q.toLowerCase();

    if(
        query === "فروش" &&
        property.dealType === "sell"
    ){
        return true;
    }

    if(
        query === "رهن" &&
        property.dealType === "deposit"
    ){
        return true;
    }

    if(
        query === "رهن و اجاره" &&
        property.dealType === "rent"
    ){
        return true;
    }

    if(
        query === "آپارتمان" &&
        property.propertyType === "apartment"
    ){
        return true;
    }

    if(
        query === "ویلا" &&
        property.propertyType === "villa"
    ){
        return true;
    }

    if(
        query === "زمین" &&
        property.propertyType === "land"
    ){
        return true;
    }

    if(
        query === "مغازه" &&
        property.propertyType === "shop"
    ){
        return true;
    }

    return searchText.includes(query);

});

renderProperties(filtered);

});

// =========================
// PANEL
// =========================

const propertyPanel =
    document.getElementById("propertyPanel");


const closeBtn =
    document.getElementById("closeBtn");

const nextBtn =
    document.getElementById("nextBtn");

const step1 =
    document.getElementById("step1");

const step2 =
    document.getElementById("step2");

const step3 =
    document.getElementById("step3");

const prevBtn =
    document.getElementById("prevBtn");

const propertyModal =
    document.getElementById("propertyModal");

const modalTitle =
    document.getElementById("modalTitle");

const modalInfo =
    document.getElementById("modalInfo");

const closeModal =
    document.getElementById("closeModal");

const overlay =
    document.getElementById("overlay");




// =========================
// FUNCTIONS
// =========================

function getNextFileCode() {

    const savedNextCode =
    parseInt(
        localStorage.getItem("nextFileCode") || 1,
        10
    );

    const highestExistingCode =
    properties.reduce((highest, property) => {

        const number =
        parseInt(
            String(property.fileCode || "")
            .replace("File-", ""),
            10
        );

        return isNaN(number)
            ? highest
            : Math.max(highest, number);

    }, 0);

    const nextCode =
    Math.max(
        savedNextCode,
        highestExistingCode + 1
    );

    return "File-" +
    String(nextCode).padStart(3, "0");

}

function openForm() {

    const fileDateInput =
    document.getElementById("fileDate");

    const fileCodeInput =
    document.getElementById("fileCode");

    if (!fileDateInput.value.trim()) {
        fileDateInput.value =
        new Date().toLocaleDateString("fa-IR");
    }

    if (!editingId) {
    fileCodeInput.value =
    getNextFileCode();
}

    propertyPanel.style.opacity = "1";

    propertyPanel.style.visibility =
    "visible";

    propertyPanel.style.transform =
    "translate(-50%,-50%) scale(1)";

    overlay.style.display = "block";

}

function closeForm() {

    propertyPanel.style.opacity = "0";

    propertyPanel.style.visibility =
    "hidden";

    propertyPanel.style.transform =
    "translate(-50%,-50%) scale(.9)";

    overlay.style.display = "none";

    currentStep = 1;

    // ریست فوتر

    closeBtn.style.display = "block";

    prevBtn.style.display = "none";

    nextBtn.innerText = "→ مرحله بعد";

    nextBtn.style.background = "#2563eb";

    nextBtn.style.color = "#fff";

    showStep(1);

    // اطلاعات اصلی

    document.getElementById("title").value = "";

    document.getElementById("propertyType").value = "";

    document.getElementById("dealType").value = "";

    // مشخصات ملک

    document.getElementById("area").value = "";

    document.getElementById("rooms").value = "";

    document.getElementById("year").value = "";

    document.getElementById("floor").value = "";

    document.getElementById("totalFloors").value = "";

    document.getElementById("totalUnits").value = "";

    document.getElementById("unitNumber").value = "";

    // امکانات

    document.getElementById("parking").checked = false;

    document.getElementById("storage").checked = false;

    document.getElementById("elevator").checked = false;

    document.getElementById("balcony").checked = false;

    
    // قیمت ها

    document.getElementById("sellPrice").value = "";

    if(document.getElementById("depositPrice")){
        document.getElementById("depositPrice").value = "";
    }

    if(document.getElementById("rentPrice")){
        document.getElementById("rentPrice").value = "";
    }

    // مالک و مستاجر

    document.getElementById("owner").value = "";

    document.getElementById("phone").value = "";

    document.getElementById("tenant").value = "";

    document.getElementById("tenantPhone").value = "";

    // توضیحات

    document.getElementById("description").value = "";

    // تصاویر

    document.getElementById("images").value = "";

    // ریست تصاویر

    selectedImages = [];

    renderImageSlots();

    // حالت ویرایش

    editingId = null;

}

function openPropertyModal(property){

    propertyModal.style.display = "block";

    modalTitle.innerText = property.title;

    modalInfo.innerHTML = `
        <p>نوع ملک: ${property.propertyType}</p>
        <p>نوع معامله: ${property.dealType}</p>
        <p>متراژ: ${property.area}</p>
        <p>مالک: ${property.owner}</p>
        <p>تلفن: ${property.phone}</p>
    `;

}

function resetForm() {

    currentStep = 1;

    showStep(1);
}

function showStep(step){

    step1.style.display = "none";
    step2.style.display = "none";
    step3.style.display = "none";

    const activeStep =
document.getElementById(
    "step" + step
);

activeStep.style.display =
"block";

activeStep.classList.remove(
    "step-animation"
);

void activeStep.offsetWidth;

activeStep.classList.add(
    "step-animation"
);

   if(step === 1){

    closeBtn.style.display =
    "block";

    prevBtn.style.display =
    "none";

    nextBtn.innerText =
    "→ مرحله بعد";
    nextBtn.style.background = "#2563eb";
    nextBtn.style.color = "#fff";

}

    if(step === 2){

    closeBtn.style.display = "none";

    prevBtn.style.display = "block";

    nextBtn.innerText = "→ مرحله بعد";


    nextBtn.style.background = "#2563eb";
    nextBtn.style.color = "#fff";

}

  if(step === 3){

    closeBtn.style.display = "none";

    prevBtn.style.display = "block";

    nextBtn.innerText = "✔ ثبت فایل";

    nextBtn.style.background = "#16a34a";

    nextBtn.style.color = "#fff";

}

updateSteps();

}

function updateSteps(){

    document
    .getElementById("stepIndicator1")
    .classList.remove("active");

    document
    .getElementById("stepIndicator2")
    .classList.remove("active");

    document
    .getElementById("stepIndicator3")
    .classList.remove("active");

    document
    .getElementById(
        "stepIndicator" + currentStep
    )
    .classList.add("active");

}


// =========================
// EVENTS
// =========================

closeBtn.addEventListener(
    "click",
    closeForm
);

closeModal.addEventListener(
    "click",
    function(){

        propertyModal.style.display = "none";

    }
);

prevBtn.addEventListener(
    "click",
    function(){

        if(currentStep > 1){

            currentStep--;

            showStep(currentStep);

        }

    }
);

nextBtn.addEventListener(
    "click",
    function(){

        if(currentStep < 3){

            currentStep++;

            showStep(currentStep);

        }else{

            saveProperty();

        }

    }
);

showStep(1);

// کلیک روی نقشه

let selectingPropertyLocation = false;

map.on("click", function (e) {

    if (selectingAgencyLocation) {

        agencyLat = e.latlng.lat;
        agencyLng = e.latlng.lng;

        selectingAgencyLocation = false;

        agencySetup.style.display = "flex";

        selectLocationBtn.classList.add("location-selected");

        selectLocationBtn.innerHTML = `
            موقعیت ثبت شد ✓
        `;

        return;
    }

    // اگر پنل جزئیات باز است
    if (
        document.getElementById("detailsPanel")
        .classList.contains("open")
    ) {
        closeDetails();
        return;
    }

    // اگر فرم ثبت فایل باز است
    if (propertyPanel.style.right === "0px") {
        closeForm();
        return;
    }

    // اگر حالت انتخاب موقعیت ملک فعال نیست، کاری نکن
    if (!selectingPropertyLocation) {
        return;
    }

    // ذخیره مختصات ملک
if (window.innerWidth <= 768) {
    const center = map.getCenter();

    selectedLat = center.lat;
    selectedLng = center.lng;
} else {
    selectedLat = e.latlng.lat;
    selectedLng = e.latlng.lng;
}

    // پایان حالت انتخاب موقعیت
    selectingPropertyLocation = false;

    map.getContainer().classList.remove("location-mode");

    console.log("Lat:", selectedLat);
    console.log("Lng:", selectedLng);

    // باز کردن فرم ثبت فایل
    openForm();

});


// زوم روی مارکر دفتر  

const officeControlBtn =
document.getElementById("officeControlBtn");

officeControlBtn.addEventListener("click", () => {

    const agencies =
    JSON.parse(
        localStorage.getItem("agencies")
    ) || [];

    const mainAgency =
    agencies.find(
        agency => agency.type === "main"
    );

    if(!mainAgency) return;

    map.flyTo(
        [mainAgency.lat, mainAgency.lng],
        15,
        {
            duration:1.2
        }
    );

});


// مراحل فرم


let selectedImage = "";

const reader = new FileReader();

reader.onload = function(event){

    let fileCode =
document.getElementById("fileCode").value.trim();

if(fileCode === ""){

    let nextCode =
    parseInt(localStorage.getItem("nextFileCode") || 1);

    fileCode =
    "File-" +
    String(nextCode).padStart(3,"0");

}

    const property = {

        id: editingId || Date.now(),

        fileCode: fileCode,

        fileDate: document.getElementById("fileDate").value.trim()
        || new Date().toLocaleDateString("fa-IR"),

        propertyType: document.getElementById("propertyType").value,
        dealType: document.getElementById("dealType").value,
        title: document.getElementById("title").value,

        lat: selectedLat,
        lng: selectedLng,

        area: document.getElementById("area").value,
        year: document.getElementById("year").value,
        rooms: document.getElementById("rooms").value,

        parking: document.getElementById("parking").checked,
        storage: document.getElementById("storage").checked,
        elevator: document.getElementById("elevator").checked,
        balcony: document.getElementById("balcony").checked,

        totalFloors: document.getElementById("totalFloors").value,
        totalUnits: document.getElementById("totalUnits").value,
        floor: document.getElementById("floor").value,
        unitNumber: document.getElementById("unitNumber").value,



        facade: document.querySelector('input[name="facade"]:checked')?.value || "",
        cabinet: document.querySelector('input[name="cabinet"]:checked')?.value || "",
        hood: document.getElementById("hood").checked,
        stove: document.getElementById("stove").checked,
        sink: document.getElementById("sink").checked,
        ceiling: document.querySelector('input[name="ceiling"]:checked')?.value || "",
        floorType: document.querySelector('input[name="floorType"]:checked')?.value || "",
        cooling: document.querySelector('input[name="cooling"]:checked')?.value || "",
        heating: document.querySelector('input[name="heating"]:checked')?.value || "",
        windowType: document.querySelector('input[name="window"]:checked')?.value || "",
        serviceType: document.querySelector('input[name="service"]:checked')?.value || "",



       sellPrice: document.getElementById("dealType").value === "sell"
        ? parseTomanValue(document.getElementById("sellPrice").value)
        : null,

       pricePerMeter: document.getElementById("dealType").value === "sell"
        ? parseTomanValue(document.getElementById("pricePerMeter").value)
        : null,

       depositPrice: document.getElementById("dealType").value === "deposit"
        ? parseTomanValue(document.getElementById("depositPrice").value)
        : null,

       rentDeposit: document.getElementById("dealType").value === "rent"
        ? parseTomanValue(document.getElementById("rentDeposit").value)
        : null,

       rentPrice: document.getElementById("dealType").value === "rent"
        ? parseTomanValue(document.getElementById("rentPrice").value)
        : null,

        owner: document.getElementById("owner").value,
        phone: document.getElementById("phone").value,
        tenant: document.getElementById("tenant").value,
        tenantPhone: document.getElementById("tenantPhone").value,

        address: document.getElementById("address").value.trim(),
        description: document.getElementById("description").value,


        images: [...selectedImages],
        imageData: event.target.result

    };

    const index = properties.findIndex(
        p => p.id === property.id
    );

    if(index !== -1){

        properties[index] = property;

    }
    else{

        properties.push(property);

        if(fileCode.startsWith("File-")){

    let currentNumber =
    parseInt(fileCode.replace("File-",""));

    if(!isNaN(currentNumber)){

        localStorage.setItem(
            "nextFileCode",
            currentNumber + 1
        );

    }

}

    }

    editingId = null;

    localStorage.setItem(
        "properties",
        JSON.stringify(properties)
    );

    if (!editingId) {

    const currentNumber =
    parseInt(
        fileCode.replace("File-", ""),
        10
    );

    if (!isNaN(currentNumber)) {

        const savedNextCode =
        parseInt(
            localStorage.getItem("nextFileCode") || 1
        );

        localStorage.setItem(
            "nextFileCode",
            Math.max(
                savedNextCode,
                currentNumber + 1
            )
        );

    }

}

    location.reload();

};

function deleteProperty(id){

    const confirmDelete =
    confirm("آیا از حذف فایل مطمئن هستید؟");

    if(!confirmDelete){
        return;
    }

    properties = properties.filter(
        property => property.id !== id
    );

    localStorage.setItem(
        "properties",
        JSON.stringify(properties)
    );

    location.reload();

}

function editProperty(id){

    const property = properties.find(
        p => p.id === id
    );

    if(!property){
        return;
    }

    editingId = id;

    // اطلاعات اصلی

document.getElementById("fileCode").value =
property.fileCode || "";

document.getElementById("fileDate").value =
property.fileDate || "";

    document.getElementById("title").value =
    property.title || "";

    document.getElementById("propertyType").value =
    property.propertyType || "";

    document.getElementById("dealType").value =
    property.dealType || "";

    // مشخصات ملک

    document.getElementById("area").value =
    property.area || "";

    document.getElementById("rooms").value =
    property.rooms || "";

    document.getElementById("year").value =
    property.year || "";

    document.getElementById("floor").value =
    property.floor || "";

    document.getElementById("totalFloors").value =
    property.totalFloors || "";

    document.getElementById("totalUnits").value =
    property.totalUnits || "";

    document.getElementById("unitNumber").value =
    property.unitNumber || "";

    // امکانات

    document.getElementById("parking").checked =
    property.parking || false;

    document.getElementById("storage").checked =
    property.storage || false;

    document.getElementById("elevator").checked =
    property.elevator || false;

    document.getElementById("balcony").checked =
    property.balcony || false;

    

   // قیمت‌ها

document.getElementById("sellPrice").value =
property.sellPrice || "";

document.getElementById("pricePerMeter").value =
property.pricePerMeter || "";

document.getElementById("depositPrice").value =
property.depositPrice || "";

document.getElementById("rentDeposit").value =
property.rentDeposit || "";

document.getElementById("rentPrice").value =
property.rentPrice || "";

    // مالک و مستاجر

    document.getElementById("owner").value =
    property.owner || "";

    document.getElementById("phone").value =
    property.phone || "";

    document.getElementById("tenant").value =
    property.tenant || "";

    document.getElementById("tenantPhone").value =
    property.tenantPhone || "";

    // توضیحات

    document.getElementById("description").value =
    property.description || "";

    // موقعیت روی نقشه

    selectedLat = property.lat;
    selectedLng = property.lng;

    // رفتن به مرحله اول

selectedImages =
property.images
? [...property.images]
: [];

renderImageSlots();

    currentStep = 1;

    showStep(1);

    nextBtn.innerText =
    "→ مرحله بعد";

    openForm();

}

const agencyBtn = document.getElementById("agencyBtn");
const agencySetup = document.getElementById("agencySetup");

agencyBtn.addEventListener("click", () => {

    agencySetup.style.display = "flex";
    agencySetup.style.opacity = "1";
    agencySetup.style.visibility = "visible";
    agencySetup.style.transform =
        "translate(-50%, -50%) scale(1)";

    overlay.style.display = "block";

});
/* =====================================
   عناصر فرم بنگاه
===================================== */

const logoUploadBtn =
document.getElementById("logoUploadBtn");

const agencyLogoInput =
document.getElementById("agencyLogoInput");

const logoPreview =
document.getElementById("logoPreview");

const logoText =
document.getElementById("logoText");

const removeLogoBtn =
document.getElementById("removeLogoBtn");

logoUploadBtn.addEventListener("click", (e) => {

    if(e.target.id === "removeLogoBtn") return;

    agencyLogoInput.click();

});


/* =====================================
   انتخاب لوگو
===================================== */

agencyLogoInput.addEventListener("change", () => {

    const file = agencyLogoInput.files[0];

    if (!file) return;

    const reader = new FileReader();

    reader.onload = function(e) {

        logoPreview.src = e.target.result;
        logoPreview.style.display = "block";

        logoText.style.display = "none";
        removeLogoBtn.style.display = "block";

        // حذف علامت مثبت پس از انتخاب لوگو
        document.getElementById("logoUploadBtn")
            .classList.add("has-logo");

    };

    reader.readAsDataURL(file);

});

/* =====================================
   حذف لوگو
===================================== */

removeLogoBtn.addEventListener(
"click",
(e) => {

    e.preventDefault();

    agencyLogoInput.value = "";

    logoPreview.src = "";

    logoPreview.style.display =
    "none";

    logoText.style.display =
    "block";

    removeLogoBtn.style.display =
    "none";

});


/* =====================================
   انتخاب موقعیت روی نقشه
===================================== */

const selectLocationBtn =
document.getElementById("selectLocationBtn");

selectLocationBtn.addEventListener("click", () => {

    // فعال کردن حالت انتخاب موقعیت دفتر
    selectingAgencyLocation = true;

    // بستن فرم ثبت دفتر
    agencySetup.style.display = "none";

    // برداشتن لایه تیره برای دسترسی به نقشه
    overlay.style.display = "none";

    // فعال کردن نشانگر انتخاب موقعیت روی نقشه
    map.getContainer().classList.add("location-mode");

    // تغییر نشانگر ماوس
    map.getContainer().style.cursor = "crosshair";

});

/* =====================================
   دکمه انصراف
===================================== */

const cancelAgencyBtn =
document.getElementById("cancelAgencyBtn");

cancelAgencyBtn.addEventListener("click", () => {

    agencySetup.style.display = "none";

    // مخفی کردن پس‌زمینه تیره
    overlay.style.display = "none";

    document.getElementById("agencyNameInput").value = "";
    document.getElementById("agencyManagerInput").value = "";
    document.getElementById("agencyPhoneInput").value = "";
    document.getElementById("agencyAddressInput").value = "";
    document.getElementById("agencyLogoInput").value = "";

    agencyLat = null;
    agencyLng = null;

    logoPreview.src = "";
    logoPreview.style.display = "none";

    logoText.style.display = "block";
    removeLogoBtn.style.display = "none";

    selectLocationBtn.innerHTML = `
        <span>انتخاب موقعیت</span>
    `;

    selectLocationBtn.classList.remove(
        "location-selected"
    );

    selectingAgencyLocation = false;

});

/* =====================================
   دکمه ثبت بنگاه
===================================== */

const saveAgencyBtn =
document.getElementById("saveAgencyBtn");

saveAgencyBtn.addEventListener("click", () => {

    let agencies =
    JSON.parse(
        localStorage.getItem("agencies")
    ) || [];

    const saveAgency = (logoData = "") => {

        const agency = {

            id:
            editingAgencyId || Date.now(),

            type:
            document.getElementById("agencyType").value,

            name:
            document.getElementById("agencyNameInput").value,

            manager:
            document.getElementById("agencyManagerInput").value,

            phone:
            document.getElementById("agencyPhoneInput").value,

            address:
            document.getElementById("agencyAddressInput").value,

            logo: logoData,

            lat: agencyLat,
            lng: agencyLng

        };

        if(editingAgencyId){

            const index =
            agencies.findIndex(
                a => a.id === editingAgencyId
            );

            if(index !== -1){

                if(!logoData){

                    agency.logo =
                    agencies[index].logo;

                }

                agencies[index] = agency;

            }

            editingAgencyId = null;

        }else{

            if(agency.type === "main"){

                const mainIndex =
                agencies.findIndex(
                    a => a.type === "main"
                );

                if(mainIndex !== -1){

                    const replaceMain =
                    confirm(
                        "دفتر اصلی قبلاً ثبت شده است. جایگزین شود؟"
                    );

                    if(!replaceMain) return;

                    agencies.splice(
                        mainIndex,
                        1
                    );

                }

            }

            agencies.push(agency);

        }

        localStorage.setItem(
            "agencies",
            JSON.stringify(agencies)
        );

        agencySetup.style.display =
        "none";

        loadAgencies();

    };

    const logoInput =
    document.getElementById("agencyLogoInput");

    const file =
    logoInput.files[0];

    if(file){

        const reader =
        new FileReader();

        reader.onload = function(e){

            saveAgency(
                e.target.result
            );

        };

        reader.readAsDataURL(file);

    }else{

        saveAgency();

    }

});

function loadAgencies(){

    const agencies =
    JSON.parse(
        localStorage.getItem("agencies")
    ) || [];

    if(agencies.length === 0) return;

    agencyMarkers.forEach(marker => {
        map.removeLayer(marker);
    });

    agencyMarkers = [];

    const mainAgency =
    agencies.find(
        a => a.type === "main"
    );

    

    agencies.forEach(agency => {

        const agencyIcon = L.divIcon({

    className:"",

    html:`

    <div class="agency-marker-wrap">

        <img
            src="icons/agency-marker.png"
            class="marker-bg">

        <div class="agency-radar"></div>

        <div class="agency-marker-type">

            ${
                agency.type === "main"
                ? "دفتر"
                : agency.type === "branch"
                ? "شعبه"
                : "همکار"
            }

        </div>

    </div>

    `,

    iconSize:[70,90],

    iconAnchor:[35,85]

});

        const agencyMarker = L.marker(
            [agency.lat, agency.lng],
            {
                icon: agencyIcon
            }
        ).addTo(map);

        agencyMarkers.push(
            agencyMarker
        );

        
agencyMarker.bindPopup(`
    <div class="agency-popup">

        <div class="agency-popup-header">

            <div class="agency-popup-logo-box">
                ${
                    agency.logo
                    ? `<img src="${agency.logo}" alt="لوگوی دفتر">`
                    : `<div class="no-logo">فاقد لوگو</div>`
                }
            </div>

            <div class="agency-popup-heading">

                <div class="agency-popup-type-top">
                    ${
                        agency.type === "main"
                        ? "دفتر اصلی"
                        : agency.type === "branch"
                        ? "شعبه"
                        : "همکار"
                    }
                </div>

                <div class="agency-popup-name">
                    ${agency.name || "بدون نام"}
                </div>

            </div>

        </div>

        
<div class="agency-popup-manager">
    <img src="icons/user.svg" alt="">
    <span><strong>مدیریت:</strong> ${agency.manager || "-"}</span>
</div>

<div class="agency-popup-phone">
    <img src="icons/phone.svg" alt="">
    <span><strong>تلفن:</strong> ${agency.phone || "-"}</span>
</div>

<div class="agency-popup-address">
    <img src="icons/location.svg" alt="">
    <span><strong>آدرس:</strong> ${agency.address || "-"}</span>
</div>


        <div class="agency-popup-actions">

            <button class="edit-btn" data-id="${agency.id}">
                <span>ویرایش</span>
                <img src="icons/edit.svg" alt="">
            </button>

            <button class="delete-btn" data-id="${agency.id}">
                <span>حذف</span>
                <img src="icons/trash.svg" alt="">
            </button>

        </div>

    </div>
`, {
    offset: [0, -65],
    className: "agency-leaflet-popup"
});


        
agencyMarker.on("popupopen", function () {

    // مخفی کردن دکمه‌های شناور در موبایل
    if (window.innerWidth <= 768) {
        document.body.classList.add("agency-popup-open");

        // وسط‌چین کردن پاپ‌آپ روی نقشه
        setTimeout(() => {
            const popupElement =
                agencyMarker.getPopup().getElement();

            if (!popupElement) return;

            const mapRect =
                map.getContainer().getBoundingClientRect();

            const popupRect =
                popupElement.getBoundingClientRect();

            const dx =
                popupRect.left + popupRect.width / 2 -
                (mapRect.left + mapRect.width / 2);

            const dy =
                popupRect.top + popupRect.height / 2 -
                (mapRect.top + mapRect.height / 2);

            map.panBy([dx, dy], { animate: true });
        }, 100);
    }

    // اتصال دکمه‌های ویرایش و حذف
    setTimeout(() => {

        const popup =
            agencyMarker.getPopup().getElement();

        if (!popup) return;

        const deleteBtn =
            popup.querySelector(".delete-btn");

        const editBtn =
            popup.querySelector(".edit-btn");

        // حذف ایجنسی
        if (deleteBtn) {
            deleteBtn.onclick = () => {

                if (confirm("بنگاه حذف شود؟")) {

                    let agencies =
                        JSON.parse(
                            localStorage.getItem("agencies")
                        ) || [];

                    agencies = agencies.filter(
                        a => a.id !== agency.id
                    );

                    localStorage.setItem(
                        "agencies",
                        JSON.stringify(agencies)
                    );

                    loadAgencies();
                }
            };
        }

        // ویرایش ایجنسی
        if (editBtn) {
            editBtn.onclick = () => {

                editingAgencyId = agency.id;

                document.getElementById("agencyType").value =
                    agency.type || "";

                document.getElementById("agencyNameInput").value =
                    agency.name || "";

                document.getElementById("agencyManagerInput").value =
                    agency.manager || "";

                document.getElementById("agencyPhoneInput").value =
                    agency.phone || "";

                document.getElementById("agencyAddressInput").value =
                    agency.address || "";

                agencyLat = agency.lat;
                agencyLng = agency.lng;

                agencySetup.style.display = "flex";
            };
        }

    }, 100);

});

// هنگام بسته‌شدن پاپ‌آپ
agencyMarker.on("popupclose", function () {
    document.body.classList.remove("agency-popup-open");
});


    });

}  

loadAgencies();

const controlCenterBtn =
document.getElementById("controlCenterBtn");

const controlMenu =
document.getElementById("controlMenu");

controlCenterBtn.addEventListener("click", () => {

    controlMenu.classList.toggle("active");

});


const dealType = document.getElementById("dealType");

const addBtn = document.getElementById("addBtn");
const addMenu = document.getElementById("addMenu");

addBtn.addEventListener("click", () => {
    addMenu.classList.toggle("active");
});


const filesBtn = document.querySelector(
    '.menuBtn[data-title="فایل ها"]'
);

const filesPanel = document.getElementById("filesPanel");
const closeFilesPanel = document.getElementById("closeFilesPanel");

filesBtn.addEventListener("click", () => {
    controlMenu.classList.remove("active");
    renderSavedProperties();
    filesPanel.classList.add("active");
});

closeFilesPanel.addEventListener("click", () => {
    filesPanel.classList.remove("active");
});



map.on("click", () => {

    // بستن منوی مرکز کنترل
    controlMenu.classList.remove("active");

    // بستن منوی افزودن
    addMenu.classList.remove("active");

});



const addFileBtn = document.getElementById("addFileBtn");

addFileBtn.addEventListener("click", () => {
    addMenu.classList.remove("active");

    selectingPropertyLocation = true;

    map.getContainer().classList.add("location-mode");
});


const fileCodeInput = document.getElementById("fileCode");

function changeDealType() {
    const type = dealType.value;

    const sellFields = document.getElementById("sellFields");
    const depositFields = document.getElementById("depositFields");
    const rentFields = document.getElementById("rentFields");

    if (!sellFields || !depositFields || !rentFields) {
        console.error("باکس‌های قیمت در HTML پیدا نشدند!");
        return;
    }

    sellFields.style.display = "none";
    depositFields.style.display = "none";
    rentFields.style.display = "none";

    if (type === "sell") {
        sellFields.style.display = "grid";
    } else if (type === "deposit") {
        depositFields.style.display = "grid";
    } else if (type === "rent") {
        rentFields.style.display = "grid";
    }
}

dealType.addEventListener("change", changeDealType);

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", changeDealType);
} else {
    changeDealType();
}


function parseTomanValue(value) {
    const englishDigits = String(value ?? "")
        .replace(/[۰-۹]/g, digit =>
            "0123456789"["۰۱۲۳۴۵۶۷۸۹".indexOf(digit)]
        )
        .replace(/[٠-٩]/g, digit =>
            "0123456789"["٠١٢٣٤٥٦٧٨٩".indexOf(digit)]
        );

    const digitsOnly = englishDigits.replace(/[٬,\s]/g, "")
        .replace(/[^\d]/g, "");

    return digitsOnly === "" ? null : Number(digitsOnly);
}

function formatTomanValue(value) {
    return Number(value).toLocaleString("fa-IR");
}

const sellPriceInput = document.getElementById("sellPrice");
const pricePerMeterInput = document.getElementById("pricePerMeter");
const areaInput = document.getElementById("area");

let lastSalePriceSource = null;

function syncSalePrices(source) {
    const area = Number(areaInput.value);
    const sourceInput =
        source === "sell" ? sellPriceInput : pricePerMeterInput;

    const sourceValue = parseTomanValue(sourceInput.value);

    if (sourceValue === null) {
        if (source === "sell") {
            pricePerMeterInput.value = "";
        } else {
            sellPriceInput.value = "";
        }
        return;
    }

    sourceInput.value = formatTomanValue(sourceValue);

    if (!Number.isFinite(area) || area <= 0) return;

    if (source === "sell") {
        pricePerMeterInput.value = formatTomanValue(
            Math.round(sourceValue / area)
        );
    } else {
        sellPriceInput.value = formatTomanValue(
            Math.round(sourceValue * area)
        );
    }
}

sellPriceInput.addEventListener("input", () => {
    lastSalePriceSource = "sell";
    syncSalePrices("sell");
});

pricePerMeterInput.addEventListener("input", () => {
    lastSalePriceSource = "perMeter";
    syncSalePrices("perMeter");
});

areaInput.addEventListener("input", () => {
    if (lastSalePriceSource) {
        syncSalePrices(lastSalePriceSource);
    }
});


function previewImages(event) {
    const files = Array.from(event.target.files);
    const input = document.getElementById("images");

    for (const file of files) {
        if (selectedImages.filter(Boolean).length >= 8) {
            break;
        }

        if (!file.type.startsWith("image/")) {
            continue;
        }

        const reader = new FileReader();

        reader.onload = function(e) {
            // اولین جای خالی را پیدا کن
            const emptyIndex = selectedImages.findIndex(img => !img);

            if (emptyIndex !== -1) {
                selectedImages[emptyIndex] = e.target.result;
            } else if (selectedImages.length < 8) {
                selectedImages.push(e.target.result);
            }

            renderImageSlots();
        };

        reader.readAsDataURL(file);
    }

    input.value = "";
}

function saveProperty(){

        const fileCodeInput =
    document.getElementById("fileCode");

    let fileCode =
    fileCodeInput.value.trim();

    if (!fileCode) {

        const nextCode =
        parseInt(
            localStorage.getItem("nextFileCode") || 1
        );

        fileCode =
        "File-" +
        String(nextCode).padStart(3, "0");

        fileCodeInput.value = fileCode;

    }

    const property = {

        id: editingId || Date.now(),

        fileCode:
        document.getElementById("fileCode").value.trim(),

        fileDate:
        document.getElementById("fileDate").value.trim()
        || new Date().toLocaleDateString("fa-IR"),

        title:
        document.getElementById("title").value,


        propertyType:
        document.getElementById("propertyType").value,
        dealType:
        document.getElementById("dealType").value,

        sellPrice:
        document.getElementById("sellPrice")?.value || "",
        pricePerMeter:
        document.getElementById("pricePerMeter")?.value || "",
        depositPrice:
        document.getElementById("depositPrice")?.value || "",
        rentDeposit:
        document.getElementById("rentDeposit")?.value || "",
        rentPrice:
        document.getElementById("rentPrice")?.value || "",

        lat: selectedLat,
        lng: selectedLng,

        area:
        document.getElementById("area").value,
        rooms:
        document.getElementById("rooms").value,
        year:
        document.getElementById("year").value,

        floor:
        document.getElementById("floor").value,
        totalFloors:
        document.getElementById("totalFloors").value,
        totalUnits:
        document.getElementById("totalUnits").value,
        unitNumber:
        document.getElementById("unitNumber").value,

        parking:
        document.getElementById("parking").checked,
        storage:
        document.getElementById("storage").checked,
        elevator:
        document.getElementById("elevator").checked,
        balcony:
        document.getElementById("balcony").checked,

        hood:
        document.getElementById("hood").checked,
        stove:
        document.getElementById("stove").checked,
        sink:
        document.getElementById("sink").checked,

        facade:
        document.querySelector('input[name="facade"]:checked')?.value || "",
        cabinet:
        document.querySelector('input[name="cabinet"]:checked')?.value || "",
        ceiling:
        document.querySelector('input[name="ceiling"]:checked')?.value || "",
        floorType:
        document.querySelector('input[name="floorType"]:checked')?.value || "",
        cooling:
        document.querySelector('input[name="cooling"]:checked')?.value || "",
        heating:
        document.querySelector('input[name="heating"]:checked')?.value || "",
        windowType:
        document.querySelector('input[name="window"]:checked')?.value || "",
        serviceType:
        document.querySelector('input[name="service"]:checked')?.value || "",

        

        owner:
        document.getElementById("owner").value,
        phone:
        document.getElementById("phone").value,
        tenant:
        document.getElementById("tenant").value,
        tenantPhone:
        document.getElementById("tenantPhone").value,

        address:
        document.getElementById("address").value,

        description:
        document.getElementById("description").value,

        images: [...selectedImages]

    };

    // ویرایش فایل

    if(editingId){

        const index =
        properties.findIndex(
            p => p.id === editingId
        );

        if(index !== -1){

            properties[index] = property;

        }

    }

    // ثبت فایل جدید

    else{

        properties.push(property);

    }

    localStorage.setItem(
        "properties",
        JSON.stringify(properties)
    );

    renderProperties();

    selectedImages = [];

    document.getElementById("images").value = "";

    document.getElementById("imagePreview").innerHTML = `
        <div
            class="upload-box"
            onclick="document.getElementById('images').click()">

            <div class="upload-plus">+</div>

            <div>افزودن تصویر</div>

        </div>
    `;

    closeForm();

}

let currentDetailsImageIndex = 0;

function renderDetailsImage() {

    const mainImageContainer =
        document.getElementById("mainImageContainer");

    if (!mainImageContainer) return;

    if (!galleryImages.length) {

        mainImageContainer.innerHTML = `

            <div class="no-image">
                تصویری ثبت نشده است
            </div>

        `;

        return;
    }

    const currentImage =
        galleryImages[currentDetailsImageIndex];

    const navigationButtons =
        galleryImages.length > 1
            ? `

                <button
                    type="button"
                    class="details-gallery-arrow details-gallery-prev"
                    onclick="changeDetailsImage(-1)"
                    title="عکس قبلی"
                >
                    ❯
                </button>

                <button
                    type="button"
                    class="details-gallery-arrow details-gallery-next"
                    onclick="changeDetailsImage(1)"
                    title="عکس بعدی"
                >
                    ❮
                </button>

                <span class="details-gallery-count">
                    ${(currentDetailsImageIndex + 1).toLocaleString("fa-IR")}
                    از
                    ${galleryImages.length.toLocaleString("fa-IR")}
                </span>

            `
            : "";

    mainImageContainer.innerHTML = `

        <img
            id="mainPropertyImage"
            class="main-property-image"
            src="${currentImage}"
            onclick="openImageViewer(${currentDetailsImageIndex})"
        >

        ${navigationButtons}

    `;
}

function changeDetailsImage(direction) {

    if (!galleryImages || galleryImages.length < 2) return;

    currentDetailsImageIndex =
        (currentDetailsImageIndex + direction + galleryImages.length)
        % galleryImages.length;

    renderDetailsImage();
}

function showPropertyDetails(id) {

    const property = properties.find(
        p => p.id === id
    );

    if (!property) return;

    const detailsBody =
        document.getElementById("detailsBody");

    if (!detailsBody) return;

    const dealTypeLabels = {
        sell: "فروش",
        deposit: "رهن کامل",
        rent: "رهن و اجاره"
    };

    const dealTypeText =
        dealTypeLabels[property.dealType] || "";

    const propertyType =
        String(property.propertyType || "").trim();

    const optionalTitle =
        String(property.title || "").trim();

    const headerTitle = [
        dealTypeText,
        propertyType,
        optionalTitle
    ].filter(Boolean).join(" | ");

    const propertyAddress =
        String(property.address || "").trim() || "آدرس ثبت نشده";

    const fileCode =
        String(property.fileCode || "").trim() || "—";

    const fileDate =
        String(property.fileDate || "").trim() || "—";

    const formatPrice = (value) => {

        const raw =
        String(value ?? "").trim();

        if (!raw) return "—";

        const number =
        Number(raw.replace(/[٬,\s]/g, ""));

        return Number.isFinite(number)
            ? number.toLocaleString("fa-IR")
            : raw;

    };

    const priceWithUnit = (value) => {

        const price = formatPrice(value);

        return price === "—"
            ? "—"
            : `${price} <small class="price-currency">تومان</small>`;

    };

    const toPersianDigits = (value) => {

    return String(value)
        .replace(/,/g, "٬")
        .replace(/[0-9]/g, digit =>
            "۰۱۲۳۴۵۶۷۸۹"[digit]
        );

};

    const withUnit = (value, unit) => {

    const text =
    String(value ?? "").trim();

    return text
        ? `${toPersianDigits(text)} ${unit}`
        : "—";

};

    const valueOrDash = (value) => {

    const text =
    String(value ?? "").trim();

    return text
        ? toPersianDigits(text)
        : "—";

};

    let priceSection = "";

    if (property.dealType === "sell") {

        priceSection = `

            <section class="details-price-section">

                <div class="details-price-grid">

                    <div class="details-price-item">
                        <span>قیمت فروش</span>
                        <strong>
                            ${priceWithUnit(property.sellPrice)}
                        </strong>
                    </div>

                    <div class="details-price-item">
                        <span>قیمت هر متر</span>
                        <strong>
                            ${priceWithUnit(property.pricePerMeter)}
                        </strong>
                    </div>

                </div>

            </section>

        `;

    }

    else if (property.dealType === "deposit") {

        priceSection = `

            <section class="details-price-section">

                <div class="details-price-grid">

                    <div class="details-price-item">
                        <span>مبلغ رهن کامل</span>
                        <strong>
                            ${priceWithUnit(property.depositPrice)}
                        </strong>
                    </div>

                </div>

            </section>

        `;

    }

    else if (property.dealType === "rent") {

        priceSection = `

            <section class="details-price-section">

                <div class="details-price-grid">

                    <div class="details-price-item">
                        <span>مبلغ رهن</span>
                        <strong>
                            ${priceWithUnit(property.rentDeposit)}
                        </strong>
                    </div>

                    <div class="details-price-item">
                        <span>مبلغ اجاره</span>
                        <strong>
                            ${priceWithUnit(property.rentPrice)}
                        </strong>
                    </div>

                </div>

            </section>

        `;

    }

    const propertyInfoSection = `

        <div class="details-info-row">

            <section class="details-basic-section">

                <div class="details-basic-grid">

                    <div class="details-basic-item">
                        <span>متراژ</span>
                        <strong>
                            ${withUnit(property.area, "متر")}
                        </strong>
                    </div>

                    <div class="details-basic-item">
                        <span>سال ساخت</span>
                        <strong>
                            ${valueOrDash(property.year)}
                        </strong>
                    </div>

                    <div class="details-basic-item">
                        <span>تعداد خواب</span>
                        <strong>
                            ${valueOrDash(property.rooms)}
                        </strong>
                    </div>

                </div>

            </section>

            <section class="details-building-section">

                <div class="details-building-grid">

                    <div class="details-building-item">
                        <span>تعداد طبقات</span>
                        <strong>
                            ${valueOrDash(property.totalFloors)}
                        </strong>
                    </div>

                    <div class="details-building-item">
                        <span>تعداد واحدها</span>
                        <strong>
                            ${valueOrDash(property.totalUnits)}
                        </strong>
                    </div>

                    <div class="details-building-item">
                        <span>طبقه واحد</span>
                        <strong>
                            ${valueOrDash(property.floor)}
                        </strong>
                    </div>

                    <div class="details-building-item">
                        <span>شماره واحد</span>
                        <strong>
                            ${valueOrDash(property.unitNumber)}
                        </strong>
                    </div>

                </div>

            </section>

        </div>

    `;

    const amenitiesSection = `

    <section class="details-amenities-section">

        <div class="details-amenities-grid">

            <div class="details-amenity">
                <span>پارکینگ</span>
                <b class="details-amenity-status
                    ${property.parking ? "is-available" : "is-unavailable"}">
                    ${property.parking ? "✓" : "×"}
                </b>
            </div>

            <div class="details-amenity">
                <span>انباری</span>
                <b class="details-amenity-status
                    ${property.storage ? "is-available" : "is-unavailable"}">
                    ${property.storage ? "✓" : "×"}
                </b>
            </div>

            <div class="details-amenity">
                <span>آسانسور</span>
                <b class="details-amenity-status
                    ${property.elevator ? "is-available" : "is-unavailable"}">
                    ${property.elevator ? "✓" : "×"}
                </b>
            </div>

            <div class="details-amenity">
                <span>بالکن</span>
                <b class="details-amenity-status
                    ${property.balcony ? "is-available" : "is-unavailable"}">
                    ${property.balcony ? "✓" : "×"}
                </b>
            </div>

            <div class="details-amenity">
                <span>هود</span>
                <b class="details-amenity-status
                    ${property.hood ? "is-available" : "is-unavailable"}">
                    ${property.hood ? "✓" : "×"}
                </b>
            </div>

            <div class="details-amenity">
                <span>گاز رومیزی</span>
                <b class="details-amenity-status
                    ${property.stove ? "is-available" : "is-unavailable"}">
                    ${property.stove ? "✓" : "×"}
                </b>
            </div>

            <div class="details-amenity">
                <span>سینک</span>
                <b class="details-amenity-status
                    ${property.sink ? "is-available" : "is-unavailable"}">
                    ${property.sink ? "✓" : "×"}
                </b>
            </div>

        </div>

    </section>

    `;

    const technicalSection = `

    <section class="details-technical-section">

        <div class="details-technical-grid">

            <div class="details-technical-item">
                <span>نما</span>
                <strong>
                    ${valueOrDash(property.facade)}
                </strong>
            </div>

            <div class="details-technical-item">
                <span>کابینت</span>
                <strong>
                    ${valueOrDash(property.cabinet)}
                </strong>
            </div>

            <div class="details-technical-item">
                <span>سقف</span>
                <strong>
                    ${valueOrDash(property.ceiling)}
                </strong>
            </div>

            <div class="details-technical-item">
                <span>کف</span>
                <strong>
                    ${valueOrDash(property.floorType)}
                </strong>
            </div>

            <div class="details-technical-item">
                <span>سرمایش</span>
                <strong>
                    ${valueOrDash(property.cooling)}
                </strong>
            </div>

            <div class="details-technical-item">
                <span>گرمایش</span>
                <strong>
                    ${valueOrDash(property.heating)}
                </strong>
            </div>

            <div class="details-technical-item">
                <span>پنجره</span>
                <strong>
                    ${valueOrDash(property.windowType)}
                </strong>
            </div>

            <div class="details-technical-item">
                <span>سرویس</span>
                <strong>
                    ${valueOrDash(property.serviceType)}
                </strong>
            </div>

        </div>

    </section>

`;

const owner = String(property.owner || "").trim();
const ownerPhone = String(property.phone || "").trim();
    const tenant = String(property.tenant || "").trim();
const tenantPhone = String(property.tenantPhone || "").trim();

const createPersonCard = (title, name, phone) => {
    const isActive = Boolean(name || phone);

    return `
        <div class="details-person-card ${isActive ? "is-active" : "is-empty"}">

            <div class="details-person-heading">
                <span class="details-person-title">${title}</span>
            </div>

            <div class="details-person-row ${name ? "is-filled" : "is-blank"}">
                <img src="icons/user.svg" class="details-person-icon" alt="">
                <span>${name || "نام ثبت نشده"}</span>
            </div>

            <div class="details-person-row ${phone ? "is-filled" : "is-blank"}">
                <img src="icons/phone.svg" class="details-person-icon" alt="">
                <span>${phone || "شماره ثبت نشده"}</span>
            </div>

        </div>
    `;
};
    const peopleSection = `
    <section class="details-people-section">
        ${createPersonCard("مالک", owner, ownerPhone)}
        ${createPersonCard("مستأجر", tenant, tenantPhone)}
    </section>
`;

const description = String(property.description || "").trim();
const safeDescription = description
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
    .replace(/\n/g, "<br>");

const descriptionSection = `
    <section class="details-description-section">

        <div class="details-description-title">
            توضیحات: 
        </div>

        <div class="details-description-content">
            ${safeDescription || "توضیحاتی ثبت نشده است"}
        </div>

    </section>
`;



    galleryImages = Array.isArray(property.images)
        ? property.images
        : [];

    currentDetailsImageIndex = 0;

    detailsBody.innerHTML = `

        <div class="details-gallery">

            <div id="mainImageContainer"></div>

        </div>

       <section class="details-file-head">

            <div class="details-file-heading">
 
                <h2 class="details-file-title">
                ${headerTitle || "بدون عنوان"}
                </h2>

            <div class="details-file-address">
                 <img src="icons/location.svg"
                 class="details-address-icon"
                 alt="">
                 <span>${propertyAddress}</span>
             </div>

            </div>

             <div class="details-file-meta">
                 <span>کد: <strong>${fileCode}</strong></span>
                 <span>تاریخ: <strong>${fileDate}</strong></span>
             </div>

       </section>

        ${priceSection}

        ${propertyInfoSection}

        ${amenitiesSection}

        ${technicalSection}

        ${peopleSection}

        ${descriptionSection}

        <!-- بخش‌های بعدی جزئیات اینجا اضافه می‌شوند -->

    `;

    renderDetailsImage();

    document.getElementById(
        "detailsPanel"
    ).classList.add("open");
}

function closeDetails(){

    document.getElementById(
        "detailsPanel"
    ).classList.remove("open");

}

function deleteProperty(id){

    const confirmDelete =
    confirm(
        "آیا از حذف این فایل مطمئن هستید؟"
    );

    if(!confirmDelete){
        return;
    }

    properties =
    properties.filter(
        p => p.id !== id
    );

    localStorage.setItem(
        "properties",
        JSON.stringify(properties)
    );

    renderProperties();

}

function renderImageSlots() {
    const preview = document.getElementById("imagePreview");
    preview.innerHTML = "";

    const imageCount = selectedImages.filter(Boolean).length;
    const slotsToShow = Math.min(8, Math.max(4, imageCount + 1));

    for (let i = 0; i < slotsToShow; i++) {
        const slot = document.createElement("div");
        slot.className = "image-slot";

        if (selectedImages[i]) {
            const img = document.createElement("img");
            img.src = selectedImages[i];
            img.alt = "تصویر ملک";

            const deleteBtn = document.createElement("button");
            deleteBtn.className = "delete-image";
            deleteBtn.type = "button";
            deleteBtn.textContent = "×";

            deleteBtn.onclick = function(event) {
                event.stopPropagation();
                selectedImages.splice(i, 1);
                renderImageSlots();
            };

            slot.appendChild(img);
            slot.appendChild(deleteBtn);
        } else {
            const plus = document.createElement("div");
            plus.className = "slot-plus";
            plus.textContent = "+";
            slot.appendChild(plus);

            slot.onclick = function() {
                selectedImageIndex = i;
                document.getElementById("images").click();
            };
        }

        preview.appendChild(slot);
    }
}

function closePropertyPanel(){

    // بستن پنل ثبت فایل
    document.getElementById("propertyPanel")
    .style.opacity = "0";

    document.getElementById("propertyPanel")
    .style.visibility = "hidden";

    // حذف لایه تار کننده پشت فرم
    document.getElementById("overlay")
    .style.display = "none";

    // برگرداندن فرم به مرحله اول
    currentStep = 1;

    step1.style.display = "block";
    step2.style.display = "none";
    step3.style.display = "none";

    // ریست دکمه های پایین فرم
    closeBtn.style.display = "block";

    prevBtn.style.display = "none";

    nextBtn.innerText = "→ مرحله بعد";

    nextBtn.style.background = "#2563eb";

    nextBtn.style.color = "#fff";

    // پاک کردن تمام فیلدهای متنی و عددی
    document
    .querySelectorAll(
        "#propertyPanel input, #propertyPanel textarea"
    )
    .forEach(el => {

        // اگر چک باکس بود تیکش برداشته شود
        if(el.type === "checkbox"){

            el.checked = false;

        }else{

            // بقیه فیلدها خالی شوند
            el.value = "";

        }

    });

    // برگرداندن همه لیست های کشویی به گزینه اول
    document
    .querySelectorAll("#propertyPanel select")
    .forEach(el => {

        el.selectedIndex = 0;

    });

    // حذف تصاویر انتخاب شده
    selectedImages = [];

    // ساخت دوباره 8 باکس خالی تصاویر
    renderImageSlots();

}

function applyFilters(){

    const parking =
    document.getElementById("parkingFilter").checked;

    const elevator =
    document.getElementById("elevatorFilter").checked;

    const storage =
    document.getElementById("storageFilter").checked;

    const balcony =
    document.getElementById("balconyFilter").checked;

    

    
    
    const sell =
    document.getElementById("sellFilter").checked;

    const deposit =
    document.getElementById("depositFilter").checked;

    const rent =
    document.getElementById("rentFilter").checked;

    const apartment =
    document.getElementById("apartmentFilter").checked;

    const villa =
    document.getElementById("villaFilter").checked;

    const land =
    document.getElementById("landFilter").checked;

    const shop =
    document.getElementById("shopFilter").checked;

    const office =
    document.getElementById("officeFilter").checked;


    const filteredProperties =
    properties.filter(property => {

        /* نوع معامله */

        const dealSelected =
        sell || deposit || rent;

        if(dealSelected){

            const dealMatch =

            (sell &&
            property.dealType === "sell")

            ||

            (deposit &&
            property.dealType === "deposit")

            ||

            (rent &&
            property.dealType === "rent");

            if(!dealMatch){
                return false;
            }

        }

        /* نوع ملک */

        const propertySelected =
        apartment ||
        villa ||
        land ||
        shop ||
        office;

        if(propertySelected){

            const propertyMatch =

(apartment &&
property.propertyType === "آپارتمان")

||

(villa &&
property.propertyType === "ویلا")

||

(land &&
property.propertyType === "زمین")

||

(shop &&
property.propertyType === "مغازه")

||

(office &&
property.propertyType === "اداری");

            if(!propertyMatch){
                return false;
            }

        }


        /* امکانات */

if(
    parking &&
    !property.parking
){
    return false;
}

if(
    elevator &&
    !property.elevator
){
    return false;
}

if(
    storage &&
    !property.storage
){
    return false;
}

if(
    balcony &&
    !property.balcony
){
    return false;
}




        return true;

    });

    renderProperties(filteredProperties);

}

function renderSavedProperties() {
    const propertiesList =
        document.getElementById("savedPropertiesList");

    let properties = [];

    try {
        properties = JSON.parse(
            localStorage.getItem("properties")
        ) || [];
    } catch (error) {
        console.error("خطا در خواندن فایل‌های املاک:", error);
    }

    // جدیدترین فایل‌ها در ابتدای فهرست
    properties.sort((a, b) => Number(b.id) - Number(a.id));

    propertiesList.innerHTML = "";

    if (properties.length === 0) {
        propertiesList.innerHTML = `
            <div class="files-empty">
                هنوز فایلی ثبت نشده است.
            </div>
        `;
        return;
    }

    

properties.forEach(property => {
    const card = document.createElement("div");
    card.className = "saved-property-card";

    const propertyTypeNames = {
        apartment: "آپارتمان",
        villa: "ویلا",
        land: "زمین",
        shop: "مغازه",
        office: "دفتر اداری"
    };

    const propertyTypeClasses = {
        apartment: "property-apartment",
        "آپارتمان": "property-apartment",
        villa: "property-villa",
        "ویلا": "property-villa",
        land: "property-land",
        "زمین": "property-land",
        shop: "property-shop",
        "مغازه": "property-shop",
        office: "property-office",
        "اداری": "property-office",
        "دفتر اداری": "property-office"
    };

    const dealTypeNames = {
        sell: "فروش",
        deposit: "رهن کامل",
        rent: "رهن و اجاره"
    };

    // تصویر ملک
    const imageBox = document.createElement("div");
    imageBox.className = "saved-property-image";

    const imageSrc = Array.isArray(property.images)
        ? property.images[0]
        : "";

    if (imageSrc) {
        const img = document.createElement("img");
        img.src = imageSrc;
        img.alt = "تصویر ملک";
        img.className = "property-image-content";
        imageBox.appendChild(img);
    } else {
        imageBox.classList.add("no-property-image");
        imageBox.textContent = "فاقد تصویر";
    }

    // اطلاعات ملک
    const info = document.createElement("div");
    info.className = "saved-property-info";

    // نوع معامله و نوع ملک
    const types = document.createElement("div");
    types.className = "saved-property-types";

    const dealBadge = document.createElement("span");
    dealBadge.className =
        `saved-property-badge deal-${property.dealType || "unknown"}`;
    dealBadge.textContent =
        dealTypeNames[property.dealType] ||
        property.dealType ||
        "نوع معامله نامشخص";

    const propertyBadge = document.createElement("span");
    propertyBadge.className = [
        "saved-property-badge",
        "property-type-badge",
        propertyTypeClasses[property.propertyType] || ""
    ].filter(Boolean).join(" ");

    propertyBadge.textContent =
        propertyTypeNames[property.propertyType] ||
        property.propertyType ||
        "نوع ملک نامشخص";

    types.append(dealBadge, propertyBadge);

    // عنوان ملک
    const title = document.createElement("div");
    title.className = "saved-property-title";
    title.textContent = property.title?.trim() || "—";
    title.title = title.textContent;

    // تاریخ و کد فایل
    const meta = document.createElement("div");
    meta.className = "saved-property-meta";

    const date = document.createElement("span");
    date.textContent = `تاریخ: ${property.fileDate || "-"}`;

    const code = document.createElement("span");
    code.textContent = `کد: ${property.fileCode || "-"}`;

    meta.append(date, code);

    // قیمت
    const priceBox = document.createElement("div");
    priceBox.className = "saved-property-price-box";

    const formatPrice = value =>
        value != null && value !== "" &&
        Number.isFinite(Number(value))
            ? `${Number(value).toLocaleString("fa-IR")} تومان`
            : "ثبت نشده";

    if (property.dealType === "sell") {
        priceBox.textContent =
            `قیمت: ${formatPrice(property.sellPrice)}`;
    } else if (property.dealType === "deposit") {
        priceBox.textContent =
            `رهن کامل: ${formatPrice(property.depositPrice)}`;
    } else if (property.dealType === "rent") {
        priceBox.textContent =
            `رهن: ${formatPrice(property.rentDeposit)} | اجاره: ${formatPrice(property.rentPrice)}`;
    } else {
        priceBox.textContent = "قیمت ثبت نشده";
    }

    // آدرس کوتاه
    const address = document.createElement("div");
    address.className = "saved-property-address";

    const locationIcon = document.createElement("img");
    locationIcon.src = "icons/location.svg";
    locationIcon.alt = "";

    const addressText = document.createElement("span");
    addressText.textContent =
        property.address?.trim() || "آدرس ثبت نشده";
    addressText.title = addressText.textContent;

    address.append(locationIcon, addressText);

    // ترتیب نمایش: برچسب‌ها، عنوان، کد و تاریخ، قیمت، آدرس
    info.append(types, title, meta, priceBox);

    card.append(imageBox, info);

    // کلیک روی کارت: رفتن به موقعیت ملک روی نقشه
    card.addEventListener("click", () => {
        const lat = Number(property.lat);
        const lng = Number(property.lng);

        if (
            property.lat != null &&
            property.lng != null &&
            Number.isFinite(lat) &&
            Number.isFinite(lng)
        ) {
            map.flyTo([lat, lng], 17, {
                animate: true,
                duration: 1.2,
                easeLinearity: 0.25
            });
        }

        filesPanel.classList.remove("active");
    });

    propertiesList.appendChild(card);
});


}


document
.querySelectorAll("#filterPanel input")
.forEach(input => {

    input.addEventListener(
        "change",
        applyFilters
    );

    input.addEventListener(
        "input",
        applyFilters
    );

});

const filterBtn =
document.getElementById("filterControlBtn");


const filterPanel =
document.getElementById("filterPanel");

const closeFilter =
document.getElementById("closeFilter");

filterBtn.addEventListener("click", () => {

    filterPanel.classList.add("open");

});

closeFilter.addEventListener("click", () => {

    filterPanel.classList.remove("open");

});

document
.getElementById("resetFilter")
.addEventListener("click", () => {

    document
    .querySelectorAll("#filterPanel input")
    .forEach(input => {

        if(input.type === "checkbox"){

            input.checked = false;

        }else{

            input.value = "";

        }

    });

    renderProperties(properties);

});

function openImageViewer(index){

    currentGalleryIndex = index;

    document.getElementById(
        "imageViewer"
    ).style.display = "flex";

    document.getElementById(
        "viewerImage"
    ).src =
    galleryImages[currentGalleryIndex];

}

function closeImageViewer(){

    document.getElementById(
        "imageViewer"
    ).style.display = "none";

}

function prevImage(){

    if(currentGalleryIndex > 0){

        currentGalleryIndex--;

        document.getElementById(
            "viewerImage"
        ).src =
        galleryImages[currentGalleryIndex];

    }

}

function nextImage(){

    if(
        currentGalleryIndex <
        galleryImages.length - 1
    ){

        currentGalleryIndex++;

        document.getElementById(
            "viewerImage"
        ).src =
        galleryImages[currentGalleryIndex];

    }

}

window.addEventListener("resize", () => {

    map.invalidateSize();

});

setTimeout(() => {

    map.invalidateSize();

}, 500);



/* ========================================
   پنل مدیریت مشاورین
======================================== */

// ===== عناصر اصلی پنل =====
const consultantsPanel = document.getElementById("consultantsPanel");
const consultantsMenuBtn = document.querySelector(
    '.menuBtn[data-title="مشاورین"]'
);
const closeConsultantsPanel = document.getElementById(
    "closeConsultantsPanel"
);
const consultantsHome = document.getElementById("consultantsHome");
const addConsultantForm = document.getElementById("addConsultantForm");
const consultantsListView = document.getElementById("consultantsListView");
const consultantsListContainer = document.getElementById(
    "consultantsListContainer"
);
// ===== دکمه‌ها =====
const addConsultantBtn = document.getElementById("addConsultantBtn");
const consultantsListBtn = document.getElementById("consultantsListBtn");
const backToConsultants = document.getElementById("backToConsultants");
const backFromConsultantsList = document.getElementById(
    "backFromConsultantsList"
);
const cancelConsultantForm = document.getElementById(
    "cancelConsultantForm"
);
const saveConsultantBtn = document.getElementById("saveConsultantBtn");

// ===== فیلدهای فرم =====
const consultantForm = document.getElementById("consultantForm");
const firstNameInput = document.getElementById("consultantFirstName");
const lastNameInput = document.getElementById("consultantLastName");
const phoneInput = document.getElementById("consultantPhone");
const usernameInput = document.getElementById("consultantUsername");
const consultantFormTitle = addConsultantForm.querySelector("h3");

// ===== مجوزهای دسترسی =====
const permissionInputs = {
    editAllProperties: document.getElementById(
        "permissionEditAllProperties"
    ),

    deleteProperties: document.getElementById(
        "permissionDeleteProperties"
    ),

    viewOwners: document.getElementById(
        "permissionViewOwners"
    ),

    viewCustomers: document.getElementById(
        "permissionViewCustomers"
    )
};
// ===== رمز عبور موقت =====
const generateConsultantPasswordBtn = document.getElementById(
    "generateConsultantPassword"
);
const consultantPasswordPreview = document.getElementById(
    "consultantPasswordPreview"
);
const consultantTemporaryPassword = document.getElementById(
    "consultantTemporaryPassword"
);
const copyConsultantPasswordBtn = document.getElementById(
    "copyConsultantPassword"
);
// ===== ذخیره‌سازی اطلاعات =====
const CONSULTANTS_STORAGE_KEY = "anzali_real_estate_consultants";
let consultants = [];
try {
    const savedConsultants = localStorage.getItem(
        CONSULTANTS_STORAGE_KEY
    );

    if (savedConsultants) {
        const parsedConsultants = JSON.parse(savedConsultants);

        if (Array.isArray(parsedConsultants)) {
            consultants = parsedConsultants;
        }
    }
} catch (error) {
    console.error("خطا در خواندن اطلاعات مشاورین:", error);
}
let editingConsultantId = null;
let generatedTemporaryPassword = "";
/* ========================================
   توابع کمکی
======================================== */

// ذخیره مشاورین در مرورگر
function saveConsultantsToStorage() {
    try {
        localStorage.setItem(
            CONSULTANTS_STORAGE_KEY,
            JSON.stringify(consultants)
        );

        return true;
    } catch (error) {
        console.error("خطا در ذخیره اطلاعات مشاورین:", error);

        alert("ذخیره اطلاعات انجام نشد. فضای ذخیره‌سازی را بررسی کنید.");

        return false;
    }
}
// خواناتر کردن متن
function escapeConsultantHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, character => {
        const entities = {
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#39;"
        };

        return entities[character];
    });
}
// گرفتن مجوزهای انتخاب‌شده
function getConsultantPermissions() {
    const permissions = [];

    Object.entries(permissionInputs).forEach(([permission, input]) => {
        if (input && input.checked) {
            permissions.push(permission);
        }
    });

    return permissions;
}
// نمایش مجوزهای ذخیره‌شده در فرم
function setConsultantPermissions(permissions = []) {
    Object.entries(permissionInputs).forEach(([permission, input]) => {
        if (input) {
            input.checked = permissions.includes(permission);
        }
    });
}
// پاک کردن رمز موقت از فرم
function clearTemporaryPassword() {
    generatedTemporaryPassword = "";

    consultantTemporaryPassword.textContent = "";
    consultantPasswordPreview.hidden = true;
}
/* ========================================
   مدیریت نمایش صفحات
======================================== */
// انیمیشن مجدد قاب پنل مشاورین
function replayConsultantsAnimation() {
    consultantsPanel.animate(
        [
            {
                opacity: 0.5,
                transform: "translate(-50%, -48%) scale(0.96)"
            },
            {
                opacity: 1,
                transform: "translate(-50%, -50%) scale(1)"
            }
        ],
        {
            duration: 250,
            easing: "ease",
            fill: "none"
        }
    );
}
// نمایش صفحه اصلی پنل
function showConsultantsHome() {
    consultantsHome.style.display = "grid";

    addConsultantForm.classList.remove("active");
    consultantsListView.style.display = "none";

    consultantsPanel.classList.remove("list-mode");

    backToConsultants.style.display = "none";
    backFromConsultantsList.style.display = "none";

    editingConsultantId = null;

    consultantForm.reset();
    setConsultantPermissions([]);
    clearTemporaryPassword();

    consultantFormTitle.textContent = "افزودن مشاور جدید";
    saveConsultantBtn.lastElementChild.textContent = "ثبت مشاور";
}
// نمایش فرم افزودن مشاور
function showAddConsultantForm() {
    replayConsultantsAnimation();

    consultantsHome.style.display = "none";
    consultantsListView.style.display = "none";

    consultantsPanel.classList.remove("list-mode");

    addConsultantForm.classList.add("active");

    backToConsultants.style.display = "flex";
    backFromConsultantsList.style.display = "none";

    editingConsultantId = null;

    consultantForm.reset();
    setConsultantPermissions([]);
    clearTemporaryPassword();

    consultantFormTitle.textContent = "افزودن مشاور جدید";
    saveConsultantBtn.lastElementChild.textContent = "ثبت مشاور";
}
// نمایش فهرست مشاورین
function showConsultantsList() {
    replayConsultantsAnimation();

    consultantsHome.style.display = "none";
    addConsultantForm.classList.remove("active");

    consultantsPanel.classList.add("list-mode");

    consultantsListView.style.display = "flex";

    backToConsultants.style.display = "none";
    backFromConsultantsList.style.display = "flex";

    editingConsultantId = null;

    renderConsultantsList();
}
/* ========================================
   تولید رمز موقت
======================================== */
function generateTemporaryPassword() {
    const characters =
        "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#";

    const passwordLength = 10;
    let password = "";

    if (window.crypto && window.crypto.getRandomValues) {
        const randomValues = new Uint32Array(passwordLength);
        window.crypto.getRandomValues(randomValues);

        for (let i = 0; i < passwordLength; i++) {
            password += characters[
                randomValues[i] % characters.length
            ];
        }
    } else {
        alert(
            "تولید رمز امن در این محیط امکان‌پذیر نیست. صفحه را از طریق localhost یا HTTPS اجرا کنید."
        );
        return;
    }

    generatedTemporaryPassword = password;

    consultantTemporaryPassword.textContent = password;
    consultantPasswordPreview.hidden = false;
}
// کپی رمز موقت
async function copyTemporaryPassword() {
    if (!generatedTemporaryPassword) {
        alert("ابتدا رمز موقت را تولید کنید.");
        return;
    }

    try {
        await navigator.clipboard.writeText(
            generatedTemporaryPassword
        );

        alert("رمز موقت کپی شد.");
    } catch (error) {
        // روش جایگزین در صورت نبود دسترسی Clipboard
        const temporaryInput = document.createElement("textarea");

        temporaryInput.value = generatedTemporaryPassword;
        temporaryInput.style.position = "fixed";
        temporaryInput.style.opacity = "0";

        document.body.appendChild(temporaryInput);

        temporaryInput.select();

        let copied = false;

        try {
            copied = document.execCommand("copy");
        } catch (copyError) {
            copied = false;
        }

        temporaryInput.remove();

        if (copied) {
            alert("رمز موقت کپی شد.");
        } else {
            alert("کپی خودکار انجام نشد؛ رمز را دستی کپی کنید.");
        }
    }
}
/* ========================================
   نمایش فهرست مشاورین
======================================== */
function renderConsultantsList() {
    consultantsListContainer.replaceChildren();

    if (consultants.length === 0) {
        const emptyMessage = document.createElement("p");

        emptyMessage.className = "consultants-empty-message";
        emptyMessage.textContent = "هنوز مشاوری ثبت نشده است.";

        consultantsListContainer.appendChild(emptyMessage);

        return;
    }

    consultants.forEach(consultant => {
        const card = document.createElement("div");

        card.className = "consultant-card";

        const fullName = [
            consultant.firstName,
            consultant.lastName
        ].filter(Boolean).join(" ");

        const name = escapeConsultantHTML(
            fullName || "بدون نام"
        );

        const phone = escapeConsultantHTML(
            consultant.phone || "ثبت نشده"
        );

        const username = escapeConsultantHTML(
            consultant.username || "ثبت نشده"
        );

        card.innerHTML = `
            <div class="consultant-card-info">
                <h4>${name}</h4>

                <p>
                    <span>موبایل:</span>
                    <span>${phone}</span>
                </p>

                <p>
                    <span>نام کاربری:</span>
                    <span>${username}</span>
                </p>
            </div>

            <div class="consultant-card-actions">
                <button
                    type="button"
                    class="edit-consultant-btn"
                    data-action="edit"
                >ویرایش</button>

                <button
                    type="button"
                    class="delete-consultant-btn"
                    data-action="delete"
                >حذف</button>
            </div>
        `;

        card.querySelector('[data-action="edit"]').addEventListener(
            "click",
            () => editConsultant(consultant.id)
        );

        card.querySelector('[data-action="delete"]').addEventListener(
            "click",
            () => deleteConsultant(consultant.id)
        );

        consultantsListContainer.appendChild(card);
    });
}
/* ========================================
   ثبت و ویرایش مشاور
======================================== */
consultantForm.addEventListener("submit", event => {
    event.preventDefault();

    const firstName = firstNameInput.value.trim();
    const lastName = lastNameInput.value.trim();
    const phone = phoneInput.value.trim();
    const username = usernameInput.value.trim();

    if (!firstName || !lastName || !phone || !username) {
        alert("لطفاً تمام فیلدهای ضروری را تکمیل کنید.");
        return;
    }

    // بررسی تکراری نبودن شماره موبایل
    const duplicatePhone = consultants.some(consultant =>
        consultant.phone === phone &&
        consultant.id !== editingConsultantId
    );

    if (duplicatePhone) {
        alert("این شماره موبایل قبلاً ثبت شده است.");
        return;
    }

    // بررسی تکراری نبودن نام کاربری
    const normalizedUsername = username.toLowerCase();

    const duplicateUsername = consultants.some(consultant =>
        String(consultant.username || "").toLowerCase() ===
            normalizedUsername &&
        consultant.id !== editingConsultantId
    );

    if (duplicateUsername) {
        alert("این نام کاربری قبلاً استفاده شده است.");
        return;
    }

    const existingConsultant = editingConsultantId !== null
        ? consultants.find(
            consultant => consultant.id === editingConsultantId
        )
        : null;

    const consultantData = {
        id: existingConsultant
            ? existingConsultant.id
            : (
                window.crypto &&
                typeof window.crypto.randomUUID === "function"
                    ? window.crypto.randomUUID()
                    : `${Date.now()}-${Math.random().toString(36).slice(2)}`
            ),

        firstName,
        lastName,
        phone,
        username,

        permissions: getConsultantPermissions(),

        // حفظ رمز موقت تولیدشده در این فرم
        temporaryPassword: generatedTemporaryPassword ||
            (existingConsultant
                ? existingConsultant.temporaryPassword || ""
                : ""),

        createdAt: existingConsultant
            ? existingConsultant.createdAt
            : new Date().toISOString(),

        updatedAt: new Date().toISOString()
    };

    const previousConsultants = [...consultants];

    if (existingConsultant) {
        consultants = consultants.map(consultant =>
            consultant.id === editingConsultantId
                ? consultantData
                : consultant
        );
    } else {
        consultants.push(consultantData);
    }

    if (!saveConsultantsToStorage()) {
        consultants = previousConsultants;
        return;
    }

    alert(
        existingConsultant
            ? "اطلاعات مشاور ویرایش شد."
            : "مشاور با موفقیت ثبت شد."
    );

    showConsultantsList();
});
/* ========================================
   باز کردن فرم ویرایش
======================================== */
function editConsultant(id) {
    const consultant = consultants.find(
        item => item.id === id
    );

    if (!consultant) {
        alert("مشاور موردنظر پیدا نشد.");
        return;
    }

    editingConsultantId = consultant.id;

    consultantsHome.style.display = "none";
    consultantsListView.style.display = "none";

    consultantsPanel.classList.remove("list-mode");

    addConsultantForm.classList.add("active");

    backToConsultants.style.display = "flex";
    backFromConsultantsList.style.display = "none";

    firstNameInput.value = consultant.firstName || "";
    lastNameInput.value = consultant.lastName || "";
    phoneInput.value = consultant.phone || "";
    usernameInput.value = consultant.username || "";

    setConsultantPermissions(consultant.permissions || []);

    clearTemporaryPassword();

    consultantFormTitle.textContent = "ویرایش اطلاعات مشاور";
    saveConsultantBtn.lastElementChild.textContent = "ذخیره تغییرات";
}
/* ========================================
   حذف مشاور
======================================== */
function deleteConsultant(id) {
    const consultant = consultants.find(
        item => item.id === id
    );

    if (!consultant) {
        alert("مشاور موردنظر پیدا نشد.");
        return;
    }

    const fullName = [
        consultant.firstName,
        consultant.lastName
    ].filter(Boolean).join(" ");

    const confirmed = confirm(
        `آیا از حذف مشاور «${fullName}» مطمئن هستید؟`
    );

    if (!confirmed) {
        return;
    }

    const previousConsultants = [...consultants];

    consultants = consultants.filter(
        item => item.id !== id
    );

    if (!saveConsultantsToStorage()) {
        consultants = previousConsultants;
        return;
    }

    renderConsultantsList();
}
/* ========================================
   رویدادهای دکمه‌ها
======================================== */

// باز کردن پنل مدیریت مشاورین
if (consultantsMenuBtn) {
    consultantsMenuBtn.addEventListener("click", () => {
        consultantsPanel.classList.add("active");
        showConsultantsHome();
    });
}
// بستن پنل
closeConsultantsPanel.addEventListener("click", () => {
    consultantsPanel.classList.remove("active");
});
// رفتن به فرم افزودن مشاور
addConsultantBtn.addEventListener("click", () => {
    showAddConsultantForm();
});
// رفتن به فهرست مشاورین
consultantsListBtn.addEventListener("click", () => {
    showConsultantsList();
});
// بازگشت از فرم به صفحه اصلی
backToConsultants.addEventListener("click", () => {
    showConsultantsHome();
});
// انصراف از فرم
cancelConsultantForm.addEventListener("click", () => {
    showConsultantsHome();
});
// بازگشت از فهرست به صفحه اصلی
backFromConsultantsList.addEventListener("click", () => {
    showConsultantsHome();
});
// تولید رمز موقت
generateConsultantPasswordBtn.addEventListener("click", () => {
    generateTemporaryPassword();
});
// کپی رمز موقت
copyConsultantPasswordBtn.addEventListener("click", () => {
    copyTemporaryPassword();
});
// بستن پنل با کلید Escape
document.addEventListener("keydown", event => {
    if (
        event.key === "Escape" &&
        consultantsPanel.classList.contains("active")
    ) {
        consultantsPanel.classList.remove("active");
    }
});
