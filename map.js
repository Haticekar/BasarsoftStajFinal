document.addEventListener("DOMContentLoaded", () => {
  const API_BASE_URL = "http://localhost:5021/api/Point";
  const INITIAL_COORDINATES = [35.2433, 38.9637];
  const INITIAL_ZOOM = 6.7;

  const addPointBtn = document.getElementById("addPointBtn");
  const resetViewBtn = document.getElementById("resetViewBtn");
  const queryBtn = document.getElementById("queryBtn");
  const geometryBtn = document.getElementById("geometryBtn");

  const map = new ol.Map({
    target: "map",
    layers: [
      new ol.layer.Tile({
        source: new ol.source.OSM(),
      }),
    ],
    view: new ol.View({
      center: ol.proj.fromLonLat(INITIAL_COORDINATES),
      zoom: INITIAL_ZOOM,
    }),
  });
  console.log(map)

  const vectorSource = new ol.source.Vector();
  const vectorLayer = new ol.layer.Vector({
    source: vectorSource,
  });
  map.addLayer(vectorLayer);

  let drawInteraction = null;

  const addInteractions = (geometryType) => {
    removeInteractions();

    drawInteraction = new ol.interaction.Draw({
      source: vectorSource,
      type: geometryType,
    });
    map.addInteraction(drawInteraction);

    drawInteraction.on("drawend", function (event) {
      const format = new ol.format.GeoJSON();
      
    const geometry = event.feature.getGeometry();
    const geoData = format.writeGeometry(geometry);
    
    if (!geoData || geoData.trim() === "") {
      console.error("Invalid geometry, cannot convert to GeoData.");
      Swal.fire("Error", "Invalid geometry. Please try again.", "error");
      return;
    }
    

    Swal.fire({
      title: "Complete drawing",
      html: `
          <div style="text-align: center;">
              <p>Please enter the name:</p>
          </div>
      `,
      input: "text",
      inputPlaceholder: "Enter the name",
      showCancelButton: true,
      confirmButtonText: "Save",
      cancelButtonText: "Cancel",
      customClass: {
        popup: "swal2-custom-popup",
        title: "swal2-custom-title",
        htmlContainer: "swal2-custom-html",
        input: "swal2-custom-input",
        confirmButton: "swal2-confirm-btn",
        cancelButton: "swal2-cancel-btn",
      },
  
        inputAttributes: {
          style: "width: 90%; padding: 8px; font-size: 14px;",
        },
        preConfirm: (name) => {
          if (!name) {
            Swal.showValidationMessage("Title field cannot be empty");
            return false;
          }
          return name;
        },
      }).then((result) => {
        if (result.isConfirmed && result.value) {
          const geometryData = {
            geoData: geoData,
            Title: result.value,
          };

          saveGeometry(geometryData);
        }
      });
    });
  };

  const removeInteractions = () => {
    if (drawInteraction) {
      map.removeInteraction(drawInteraction);
      drawInteraction = null;
    }
  };

  const saveGeometry = async (geometryData) => {
    try {
      const response = await fetch("http://localhost:5021/api/Point", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(geometryData),
      });

      if (response.ok) {
        Swal.fire("SUCCESS", "Added.", "success");

        // Geo data formatını ve geometrinin oluşturulmasını kontrol etmek için
        const geoDataFormat = new ol.format.GeoJSON();
        const feature = geoDataFormat.readFeature(geometryData.geoData, {
          dataProjection: "EPSG:3857", 
          featureProjection: map.getView().getProjection(),
        });
        console.log(`asd: ${response.json()}`);

        if (!feature) {
          console.error("Failed to create geometry. geoData:", geometryData.geoData);
          return;
        }

        feature.set("name", geometryData.Title);
        vectorSource.addFeature(feature);

        const extent = feature.getGeometry().getExtent();
        console.log("Extent:", extent);

        if (!ol.extent.isEmpty(extent)) {
          map.getView().fit(extent, { duration: 1000, maxZoom: 12 });
        } else {
          console.warn(
            "Free space provided for geometry."
          );
        }
      } else {
        const errorData = await response.json();
        
    const errorMessage = errorData.message || "API request failed";
    console.error("API error:", errorMessage);
    Swal.fire("Error", errorMessage, "error");
    return;
    
      }
    } catch (error) {
      console.error("There is a mistake:", error);
      Swal.fire("Error", error.message, "error");
    }
  };

  const loadMarkers = async () => {
    try {
      //veritabanini bir temizleyebilir miyiz
      const response = await fetch("http://localhost:5021/api/Point");
      const data = await response.json();
      if (data.status) {
        const points = data.value;
        const geoDataFormat = new ol.format.GeoJSON();

        points.forEach((point) => {
          const feature = geoDataFormat.readFeature(point.geoData, {
            dataProjection: "EPSG:3857", 
            featureProjection: map.getView().getProjection(),
          });
          feature.setId(point.uniqueId);
          feature.set("name", point.Title);
          vectorSource.addFeature(feature);
        });
      } else {
        console.error("Data error:", data.message);
      }
    } catch (error) {
      console.error("Data error:", error);
    }
  };

  // Güncelleme seçeneği
  window.updateGeometry = function (UniqueId) {
    Swal.fire({
      title: "Update Option",
      text: "SELECT UPDATE OPTION:",
      showCancelButton: true,
      confirmButtonText: "Manuel",
      cancelButtonText: "Panel",
    }).then((result) => {
      if (result.isConfirmed) {
        // Manuel olan seçilince 
        window.manualUpdate(UniqueId);
      } else if (result.dismiss === Swal.DismissReason.cancel) {
        // Panel olan seçilince
        window.panelUpdate(UniqueId);
      }
    });
  };

  // Manuel fonksiyonu
  window.manualUpdate = function (UniqueId) {
    // Query kapat
    resetMapView();
    const openPanels = jsPanel.getPanels();
    openPanels.forEach((panel) => panel.close());

    // Geometrinin sürüklenmesi olunca olan güncelleme 
    window.activateManualUpdate(UniqueId);
  };

  // Geometriyi manuel olarak güncelleme 
  window.activateManualUpdate = function (UniqueId) {
    // Seçilen geometriyi bulalım
    const feature = vectorSource.getFeatureById(UniqueId);
    if (!feature) {
      Swal.fire("Error", "Geometry not found.", "error");
      return;
    }

    // Translate (Geometriyi taşımak için)
    const translateInteraction = new ol.interaction.Translate({
      features: new ol.Collection([feature]),
    });
    map.addInteraction(translateInteraction);

    // Modify (Geometrinin noktalarını değiştirmek için)
    const modifyInteraction = new ol.interaction.Modify({
      features: new ol.Collection([feature]),
    });
    map.addInteraction(modifyInteraction);

    // Geometri taşınıp veya noktaları değiştirildiğinde çağrılan fonksiyon
    const onGeometryChange = function (event) {
      const modifiedFeature = event.features
        ? event.features.item(0)
        : event.target.getFeatures().item(0);
      const modifiedGeometry = modifiedFeature.getGeometry();
      const geoDataFormat = new ol.format.GeoJSON();
      const updatedgeoData = geoDataFormat.writeGeometry(modifiedGeometry);

      Swal.fire({
        title: "Approval for Update",
        text: "Do You Want to Save the Update?",
        showCancelButton: true,
        confirmButtonText: "YES",
        cancelButtonText: "NO",
      }).then((result) => {
        if (result.isConfirmed) {
          // Geometriyi kayıt için backend isteği
          window.performManualUpdate(UniqueId, updatedgeoData);
          
          map.removeInteraction(modifyInteraction);
          map.removeInteraction(translateInteraction);
        } else {
          // Cancel the changed
          feature
            .getGeometry()
            .setCoordinates(modifiedGeometry.getCoordinates());
          map.removeInteraction(modifyInteraction);
          map.removeInteraction(translateInteraction);
        }
      });
    };

    
    modifyInteraction.on("modifyend", onGeometryChange);
    translateInteraction.on("translateend", onGeometryChange);
  };

  // Manuel olan güncelleme için backende istekte bulunma 
  window.performManualUpdate = function (UniqueId, updatedgeoData, name) {
    // isim alanı boş olmaması için 
    if (!name || name.trim() === "") {
      Swal.fire({
        title: "Required Name",
        text: "Please Enter the Name:",
        input: "text",
        inputPlaceholder: "Enter Name",
        showCancelButton: true,
        confirmButtonText: "SAVE",
        cancelButtonText: "CANCEL",
        preConfirm: (inputValue) => {
          if (!inputValue) {
            Swal.showValidationMessage("Name Field Cannot Be Empty.");
            return false;
          }
          return inputValue;
        },
      }).then((result) => {
        if (result.isConfirmed) {
          const updatedTitle = result.value;
          // isim girdiğinde 
          window.performManualUpdate(UniqueId, updatedgeoData, updatedTitle);
        }
      });
    } else {
      // Güncelleme backende gönderiliyor
      fetch(`http://localhost:5021/api/Point/${UniqueId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ uniqueId: UniqueId, title: name, geoData: updatedgeoData }),
      })
        .then((response) => {
          if (!response.ok) {
            return response.json().then((data) => {
              let errorMessage = "Update Failed.";
              if (data.errors) {
                errorMessage = Object.values(data.errors).flat().join(" ");
              }
              throw new Error(errorMessage);
            });
          }
          return response.json();
        })
        .then((data) => {
          Swal.fire("SUCCESS!", "Geometry Updated.", "success");
          loadMarkers(); // Haritayı güncellemek için markerları yeniden yükleyin
          resetMapView(); // Haritayı ilk açılış haline döndür
        })
        .catch((error) => {
          Swal.fire("ERROR", error.message, "error");
          console.error("Update Error:", error);
        });
    }
  };

  // Panel için güncelleme 
  window.performPanelUpdate = function (UniqueId, name, geoData) {
    fetch(`http://localhost:5021/api/Point/${UniqueId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ uniqueId: UniqueId, title: name, geodata: geoData }),
    })
      .then((response) => {
        if (!response.ok) {
          return response.json().then((data) => {
            let errorMessage = "Update Failed.";
            if (data.errors) {
              errorMessage = Object.values(data.errors).flat().join(" ");
            }
            throw new Error(errorMessage);
          });
        }
        return response.json();
      })
      .then((data) => {
        Swal.fire("Success!", "Update Successful.", "success");
        loadMarkers(); // Haritayı güncellemek için markerları yeniden yükleyin
        resetMapView(); // Haritayı ilk açılış haline döndür
      })
      .catch((error) => {
        Swal.fire("ERROR!", error.message, "error");
      });
  };

  // Panel güncellemesi
  window.panelUpdate = function (UniqueId) {
    // Geometri verileri için backendi çağır(API)
    fetch(`${API_BASE_URL}/${UniqueId}`)
      .then((response) => response.json())
      .then((point) => {
        if (!point || !point.value) {
          throw new Error("No geometry data found");
        }

        console.log(point.value);
        const existingTitle = point.value.title;
        const existinggeoData = point.value.geoData;

        // SweetAlert2 ile bir popup aç ve mevcut bilgileri yerleştir ? gpt 
        Swal.fire({
          title: "Updated Geometry",
          html: `
                      <div style="text-align: left;">
                          <label for="name" style="display: block; font-weight: bold; margin-bottom: 5px;">Yeni İsim:</label>
                          <input type="text" id="name" class="swal2-input" value="${existingTitle}" placeholder="İsim girin" style="width: 100%; box-sizing: border-box;">
                      </div>
                      <div style="text-align: left; margin-top: 10px;">
                          <label for="geoData" style="display: block; font-weight: bold; margin-bottom: 5px;">Yeni geoData:</label>
                          <textarea id="geoData" class="swal2-textarea" style="width: 100%; height: 100px; box-sizing: border-box;">${existinggeoData}</textarea>
                      </div>
                  `,
          confirmButtonText: "Update",
          showCancelButton: true,
          preConfirm: () => {
            const name = Swal.getPopup().querySelector("#name").value;
            const geoData = Swal.getPopup().querySelector("#geoData").value;
            if (!name || !geoData) {
              Swal.showValidationMessage("All Fields Must Be Filled");
              return false;
            }
            return { name, geoData };
          },
        }).then((result) => {
          if (result.isConfirmed) {
            // Güncelleme işlemini 
            window.performPanelUpdate(UniqueId, result.value.name, result.value.geoData);
          }
        });
      })
      .catch((error) => {
        Swal.fire("Error", error.message, "error");
      });
  };

  window.showDetails = async function (UniqueId) {
    try {
      const response = await fetch(`${API_BASE_URL}/${UniqueId}`);
      if (!response.ok) throw new Error("Failed to fetch point data");

      const data = await response.json();
      const point = data.value;

      if (!point) throw new Error("Geometry not found");

      const geoDataFormat = new ol.format.GeoJSON();
      const pointCoords = geoDataFormat.readGeometry(point.geoData, {
        dataProjection: "EPSG:3857", // Projeksiyonu kontrol etmek için 
        featureProjection: map.getView().getProjection(),
      });

      
      const extent = pointCoords.getExtent();
      map.getView().fit(extent, { maxZoom: 12, duration: 1000 });

      // js panleini kapatmak için 
      const openPanels = jsPanel.getPanels();
      openPanels.forEach((panel) => panel.close());

      document.getElementById('resetViewBtn').addEventListener('click', () => {
        // Popup'taki verileri temizle
        document.getElementById('popup-UniqueId').innerText = '';
        document.getElementById('popup-Title').innerText = '';
        document.getElementById('popup-geoData').innerText = '';
        
      });
      // Popup güncelleme 
      document.getElementById("popup-UniqueId").innerText = point.uniqueId;
      document.getElementById("popup-Title").innerText = point.title;
      document.getElementById("popup-geoData").innerText = point.geoData;
      document
        .getElementById("update-btn")
        .classList.add("edit-btn", "popup-btn"); // Edit Button 
      document
        .getElementById("delete-btn")
        .classList.add("delete-btn", "popup-btn"); // Delete Button 
      document
        .getElementById("close-popup-btn")
        .classList.add("close-btn", "popup-btn"); // Close Button 

      // pop up harita üzerinde gösterilmesi 
      const popup = document.getElementById("popup");
      const coordinate = pointCoords.getLastCoordinate(); // son koordinat 

      const pixel = map.getPixelFromCoordinate(coordinate);
      popup.style.left = `${pixel[0]}px`;
      popup.style.top = `${pixel[1]}px`;
      popup.style.display = "block";
      document.getElementById("update-btn").innerHTML =
        '<i class="fas fa-edit"></i>'; // düzenleme
      document.getElementById("delete-btn").innerHTML =
        '<i class="fas fa-trash"></i>'; // silme
      document.getElementById("close-popup-btn").innerHTML =
        '<i class="fas fa-times"></i>'; // kapatma

      // güncellem ve sil işlevselliği
      document.getElementById("update-btn").onclick = function () {
        updateGeometry(UniqueId);
        closePopup();
      };

      document.getElementById("delete-btn").onclick = function () {
        deleteGeometry(UniqueId);
        closePopup();
      };

      // kapatma
      document.getElementById("close-popup-btn").onclick = function () {
        closePopup();
        resetMapView(); // haritayı ilk haline getirmek için 
      };
    } catch (error) {
      console.error("Error:", error.message);
    }
  };

  function closePopup() {
    document.getElementById("popup").style.display = "none";
  }

  function resetMapView() {
    map.getView().animate({
      center: ol.proj.fromLonLat(INITIAL_COORDINATES),
      zoom: INITIAL_ZOOM,
      duration: 1000,
    });
  }

  function closePopup() {
    document.getElementById("popup").style.display = "none";
  }

  let longPressTimer = null;
let isLongPress = false;

map.on("singleclick", function (evt) {
  if (!isLongPress) {
    map.forEachFeatureAtPixel(evt.pixel, function (feature) {
      const UniqueId = feature.getId();
      if (UniqueId) {
        window.showDetails(UniqueId);
      }
    });
  }
  isLongPress = false;
});

map.on('pointerdown', (event) => {
  longPressTimer = setTimeout(() => {
    isLongPress = true;
    const coordinates = event.coordinate;

    Swal.fire({
      title: 'Add Point',
      text: 'Enter a title for this point:',
      input: 'text',
      inputPlaceholder: 'Point title',
      showCancelButton: true,
      confirmButtonText: 'Add',
      cancelButtonText: 'Cancel',
      preConfirm: (name) => {
        if (!name) {
          Swal.showValidationMessage('Please enter a title.');
          return false;
        }
        return name;
      }
    }).then((result) => {
      if (result.isConfirmed && result.value) {
        const pointTitle = result.value;

        // Noktayı backend'e kaydet
        const geometryData = {
          geoData: JSON.stringify({
            type: 'Point',
            coordinates: coordinates
          }),
          Title: pointTitle
        };

        saveGeometry(geometryData); 

        // Haritada noktayı ekle
        const pointFeature = new ol.Feature({
          geometry: new ol.geom.Point(coordinates),
          name: pointTitle,
        });

        const pointStyle = new ol.style.Style({
          image: new ol.style.Circle({
            radius: 7,
            fill: new ol.style.Fill({
              color: 'rgba(38, 166, 91, 0.8)', 
            }),
            stroke: new ol.style.Stroke({
              color: '#1abc9c',  
              width: 3,
            }),
          }),
        });

        pointFeature.setStyle(pointStyle);
        vectorSource.addFeature(pointFeature);
      }
    });
  }, 3000);
});

map.on('pointerup', () => {
  clearTimeout(longPressTimer);
  isLongPress = false;
});

map.on('pointermove', () => {
  clearTimeout(longPressTimer);
});


  window.deleteGeometry = async function (UniqueId) {
    const confirmDelete = await Swal.fire({
      title: "Are You Sure To Delete?",
      text: `Do you want to delete the geometric shape with ID ${UniqueId}?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "YES",
      cancelButtonText: "NO",
    });

    if (confirmDelete.isConfirmed) {
      try {
        const response = await fetch(`${API_BASE_URL}/${UniqueId}`, {
          method: "DELETE",
        });

        if (response.ok) {
          Swal.fire(
            "Deleted!",
            `Geometric shape cylinder with ID ${UniqueId}.`,
            "success"
          );
          vectorSource.clear(); 
          loadMarkers(); // Geometriyi yeniden yükle 
          resetMapView(); // Harita ilk hale geldi 

          // Query panelinin kapanması için 
          const openPanels = jsPanel.getPanels();
          openPanels.forEach((panel) => panel.close());
        } else {
          const errorText = await response.text();
          console.error("Silme işlemi başarısız:", errorText);
          throw new Error(errorText || "Delete failed");
        }
      } catch (error) {
        console.error("Deletion failed.", error);
        Swal.fire("Error", `Deletion failed: ${error.message}`, "error");
      }
    } else {
      resetMapView(); 
    }
  };
  geometryBtn.addEventListener("click", () => {
    Swal.fire({
      title: "Select Geometry Type",
      html: `
            <select id="geometryType" class="swal2-input">
                <option value="" disabled selected>Geometri Türünü Seçin</option>
                <option value="LineString">LineString</option>
                <option value="Polygon">Polygon</option>
            </select>
        `,
      confirmButtonText: "Select",
      showCancelButton: true,
      cancelButtonText: "Cancel",
      customClass: {
        popup: "swal2-custom-popup",
        title: "swal2-custom-title",
        htmlContainer: "swal2-custom-html",
        confirmButton: "swal2-confirm-btn",
        cancelButton: "swal2-cancel-btn",
      },
      preConfirm: () => {
        const selectedType = document.getElementById("geometryType").value;
        if (!selectedType) {
          Swal.showValidationMessage("Select Geometry Type.");
          return false;
        }
        return selectedType;
      },
    }).then((result) => {
      if (result.isConfirmed) {
        const selectedType = result.value;
        addInteractions(selectedType);
        Swal.fire(
          "Geometry Selected",
          `Selected Geometry: ${selectedType}`,
          "success"
        );
      }
    });
  });

  const openQueryPanel = async () => {
    try {
      const response = await fetch(API_BASE_URL);
      if (!response.ok) {
        throw new Error(`API Failed: ${response.status}`);
      }
      const data = await response.json();
      if (data.status) {
        const points = data.value;
        const html = generateGeometriesTableHTML(points);
        showQueryPanel(html);
      } else {
        Swal.fire("Error", data.message, "error");
      }
    } catch (error) {
      Swal.fire("Error", error.message, "error");
    }
  };

  const generateGeometriesTableHTML = (points) => {
    let html = `
        <table class="table table-bordered">
            <thead>
                <tr>
                    <th>GeoData</th>
                    <th>Title</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>
    `;

    points.forEach((point) => {
      html += `
            <tr>
                <td>${point.geoData}</td>
                <td>${point.title}</td>
                <td>
                    <button class="btn btn-info btn-sm" onclick="showDetails(${point.uniqueId})">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="btn btn-warning btn-sm" onclick="updateGeometry(${point.uniqueId})">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-danger btn-sm" onclick="deleteGeometry(${point.uniqueId})">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `;
    });

    html += `
            </tbody>
        </table>
    `;

    return html;
  };

  const showQueryPanel = (html) => {
    jsPanel.create({
      position: "center",
      contentSize: "850 450",
      headerTitle: "Geometries",
      theme: "primary",
      content: html,
    });
  };

  queryBtn.addEventListener("click", openQueryPanel);

  resetViewBtn.addEventListener("click", () => {
    map.getView().animate({
      center: ol.proj.fromLonLat(INITIAL_COORDINATES),
      zoom: INITIAL_ZOOM,
      duration: 1000,
    });
    document.getElementById("close-popup-btn").click();
  });

 drawInteraction = null;

// Add Point butonuna tıklandığında
addPointBtn.addEventListener("click", () => {
  // Eğer daha önce bir etkileşim eklenmişse, onu kaldır
  if (drawInteraction) {
    map.removeInteraction(drawInteraction);
    drawInteraction = null;
  }

  // Kullanıcıya bir nokta seçmesini istemek için bir pop-up göster
  Swal.fire({
    title: "Add Point",
    text: "Please select a point on the map.",
    icon: "info",
    confirmButtonText: "OK"
  }).then(() => {
    // Haritaya bir "draw" etkileşimi ekleyelim (sadece nokta için)
    drawInteraction = new ol.interaction.Draw({
      source: vectorSource,  // Haritaya eklenecek özellikler için
      type: 'Point'  // Nokta tipi
    });

    map.addInteraction(drawInteraction);

    // Nokta seçildiğinde tetiklenen olay
    drawInteraction.on('drawend', (event) => {
      const feature = event.feature;
      const coordinates = feature.getGeometry().getCoordinates();

      // Koordinatları GeoJSON formatında kaydedelim
      const geoDataFormat = new ol.format.GeoJSON();
      const geoData = geoDataFormat.writeGeometry(feature.getGeometry());

      // Kullanıcıdan nokta için isim iste
      Swal.fire({
        title: "Enter Point Name",
        input: "text",
        inputPlaceholder: "Enter the name",
        showCancelButton: true,
        confirmButtonText: "Save",
        cancelButtonText: "Cancel"
      }).then((result) => {
        if (result.isConfirmed && result.value) {
          const pointName = result.value;

          // Nokta backend'e kaydedilecek (API isteği)
          savePoint({ title: pointName, geoData: geoData });
          
          Swal.fire("Success", "Point has been added.", "success");
        } else {
          // İptal edildiğinde, çizilen noktayı kaldır
          vectorSource.removeFeature(feature);
        }

        // Etkileşimi kaldır
        map.removeInteraction(drawInteraction);
        drawInteraction = null;
      });
    });
  });
});

// Noktayı backend'e kaydetme fonksiyonu
const savePoint = async (pointData) => {
  try {
    const response = await fetch("http://localhost:5021/api/Point", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(pointData)
    });

    if (!response.ok) {
      throw new Error("Failed to save the point.");
    }

    return await response.json();
  } catch (error) {
    Swal.fire("Error", error.message, "error");
  }
};

  // Uygulama açılınca  geometrileri yükleyelim
  loadMarkers();
});
