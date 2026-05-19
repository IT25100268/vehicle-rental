package com.vehiclerental.repository;

import com.vehiclerental.model.*;
import org.springframework.stereotype.Repository;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.*;
import java.util.*;

@Repository
public class VehicleRepository {
    private final List<Vehicle> vehicles = new ArrayList<>();
    private final String fileName = "vehicles.txt";
    private final Path dataPath;

    public VehicleRepository() {

        Path cwd = Paths.get(System.getProperty("user.dir")).normalize();
        Path dir = cwd.resolve("data");
        if (!Files.exists(dir)) {
            dir = cwd.resolve("backend").resolve("data");
        }
        this.dataPath = dir.resolve(fileName);
        
        try {
            if (!Files.exists(dir)) {
                Files.createDirectories(dir);
            }
        } catch (IOException e) {
            System.err.println("Error creating data directory: " + e.getMessage());
        }
        
        load();
    }

    public void load() {
        vehicles.clear();
        if (!Files.exists(dataPath)) {
            return;
        }

        try {
            List<String> lines = Files.readAllLines(dataPath, StandardCharsets.UTF_8);
            for (String line : lines) {
                if (line != null && !line.trim().isEmpty()) {
                    Vehicle v = mapToEntity(line.trim());
                    if (v != null) {
                        vehicles.add(v);
                    }
                }
            }
        } catch (IOException e) {
            System.err.println("Error reading " + fileName + ": " + e.getMessage());
        }
    }

    public void saveAll() {
        List<String> lines = new ArrayList<>();
        for (Vehicle v : vehicles) {
            lines.add(mapToString(v));
        }
        try {
            Files.write(dataPath, lines, StandardCharsets.UTF_8);
        } catch (IOException e) {
            System.err.println("Error writing to " + fileName + ": " + e.getMessage());
        }
    }

    public Vehicle save(Vehicle vehicle) {
        if (vehicle.getId() == null || vehicle.getId().isEmpty()) {
            vehicle.setId(UUID.randomUUID().toString());
            vehicles.add(vehicle);
        } else {

            for (int i = 0; i < vehicles.size(); i++) {
                if (vehicles.get(i).getId().equals(vehicle.getId())) {
                    vehicles.set(i, vehicle);
                    break;
                }
            }
        }
        saveAll();
        return vehicle;
    }

    public List<Vehicle> findAll() {
        return new ArrayList<>(vehicles);
    }

    public Optional<Vehicle> findById(String id) {
        for (Vehicle v : vehicles) {
            if (v.getId().equals(id)) {
                return Optional.of(v);
            }
        }
        return Optional.empty();
    }

    public void deleteById(String id) {
        for (int i = 0; i < vehicles.size(); i++) {
            if (vehicles.get(i).getId().equals(id)) {
                vehicles.remove(i);
                break;
            }
        }
        saveAll();
    }

    public List<Vehicle> findAvailable() {
        List<Vehicle> available = new ArrayList<>();
        for (Vehicle v : vehicles) {
            if (v.isAvailableForRent()) {
                available.add(v);
            }
        }
        return available;
    }

    public List<Vehicle> findByType(String type) {
        List<Vehicle> filtered = new ArrayList<>();
        for (Vehicle v : vehicles) {
            if (type.equalsIgnoreCase(v.getType())) {
                filtered.add(v);
            }
        }
        return filtered;
    }

    private Vehicle mapToEntity(String line) {
        String[] parts = line.split("\\|", -1);
        if (parts.length < 7) return null;

        String id = parts[0];
        String type = parts[1];
        String make = unescape(parts[2]);
        String modelName = unescape(parts[3]);
        int year = parts[4].isEmpty() ? 0 : Integer.parseInt(parts[4]);
        double pricePerDay = parts[5].isEmpty() ? 0.0 : Double.parseDouble(parts[5]);
        double pricePerHour = parts[6].isEmpty() ? 0.0 : Double.parseDouble(parts[6]);

        Vehicle v;
        if ("BIKE".equalsIgnoreCase(type)) v = new Bike();
        else if ("VAN".equalsIgnoreCase(type)) v = new Van();
        else if ("THREEWHEELER".equalsIgnoreCase(type)) v = new ThreeWheeler();
        else v = new Car();

        v.setId(id);
        v.setType(type);
        v.setMake(make);
        v.setModel(modelName);
        v.setYear(year);
        v.setPricePerDay(pricePerDay);
        v.setPricePerHour(pricePerHour);

        if (parts.length > 7) v.setLocation(unescape(parts[7]));
        if (parts.length > 8) v.setVehicleStatus(parts[8]);
        if (parts.length > 9) v.setAvailable(Boolean.parseBoolean(parts[9]));
        if (parts.length > 10 && !parts[10].isEmpty()) {
            v.setPhotos(new ArrayList<>(Arrays.asList(parts[10].split(","))));
        }
        if (parts.length > 11) v.setDescription(unescape(parts[11]));
        if (parts.length > 12) v.setColor(unescape(parts[12]));
        if (parts.length > 13) v.setFuelType(unescape(parts[13]));
        if (parts.length > 14) v.setVin(unescape(parts[14]));
        if (parts.length > 15 && !parts[15].isEmpty()) v.setSeatingCapacity(Integer.parseInt(parts[15]));
        if (parts.length > 16) v.setMaintenanceReason(unescape(parts[16]));
        if (parts.length > 17) v.setMaintenanceStartDate(unescape(parts[17]));
        if (parts.length > 18) v.setMaintenanceEndDate(unescape(parts[18]));

        if (v instanceof Bike && parts.length > 20) {
            ((Bike) v).setEngineCC(parts[19].isEmpty() ? 0 : Integer.parseInt(parts[19]));
            ((Bike) v).setBikeType(unescape(parts[20]));
        } else if (v instanceof Van && parts.length > 20) {
            ((Van) v).setVanBodyType(unescape(parts[19]));
            ((Van) v).setPassengerCapacity(parts[20].isEmpty() ? 0 : Integer.parseInt(parts[20]));
        } else if (v instanceof ThreeWheeler && parts.length > 20) {
            ((ThreeWheeler) v).setRouteType(unescape(parts[19]));
            ((ThreeWheeler) v).setElectric(Boolean.parseBoolean(parts[20]));
        } else if (v instanceof Car && parts.length > 19) {
            ((Car) v).setCarCategory(unescape(parts[19]));
        }

        if (parts.length > 21) {
            try {
                v.setAverageRating(parts[21].isEmpty() ? 0.0 : Double.parseDouble(parts[21]));
            } catch (NumberFormatException e) {}
        }
        if (parts.length > 22) {
            try {
                v.setReviewCount(parts[22].isEmpty() ? 0 : Integer.parseInt(parts[22]));
            } catch (NumberFormatException e) {}
        }

        return v;
    }

    private String mapToString(Vehicle v) {
        StringBuilder sb = new StringBuilder();
        sb.append(v.getId()).append("|")
          .append(v.getType()).append("|")
          .append(escape(v.getMake())).append("|")
          .append(escape(v.getModel())).append("|")
          .append(v.getYear()).append("|")
          .append(v.getPricePerDay()).append("|")
          .append(v.getPricePerHour()).append("|")
          .append(escape(v.getLocation())).append("|")
          .append(v.getVehicleStatus()).append("|")
          .append(v.isAvailable()).append("|");
        
        if (v.getPhotos() != null && !v.getPhotos().isEmpty()) {
            sb.append(String.join(",", v.getPhotos()));
        }
        sb.append("|");
        
        sb.append(escape(v.getDescription())).append("|")
          .append(escape(v.getColor())).append("|")
          .append(escape(v.getFuelType())).append("|")
          .append(escape(v.getVin())).append("|")
          .append(v.getSeatingCapacity()).append("|")
          .append(escape(v.getMaintenanceReason())).append("|")
          .append(escape(v.getMaintenanceStartDate())).append("|")
          .append(escape(v.getMaintenanceEndDate())).append("|");

        if (v instanceof Bike) {
            Bike b = (Bike) v;
            sb.append(b.getEngineCC()).append("|").append(escape(b.getBikeType()));
        } else if (v instanceof Van) {
            Van vn = (Van) v;
            sb.append(escape(vn.getVanBodyType())).append("|").append(vn.getPassengerCapacity());
        } else if (v instanceof ThreeWheeler) {
            ThreeWheeler tw = (ThreeWheeler) v;
            sb.append(escape(tw.getRouteType())).append("|").append(tw.isElectric());
        } else if (v instanceof Car) {
            Car c = (Car) v;
            sb.append(escape(c.getCarCategory())).append("|");
        }
        
        sb.append("|").append(v.getAverageRating()).append("|").append(v.getReviewCount());
        
        return sb.toString();
    }

    private String escape(String s) {
        if (s == null) return "";
        return s.replace("|", "\\|");
    }

    private String unescape(String s) {
        if (s == null || s.isEmpty()) return null;
        return s.replace("\\|", "|");
    }
}
