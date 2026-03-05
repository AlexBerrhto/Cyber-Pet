import time
import threading
from fastapi import FastAPI, HTTPException  # Added HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from Backend.database import (
    init_db, 
    save_user_pet, 
    get_user_pet, 
    log_action_smart,  # Make sure this is here!
         
)

# 1. Define Request Model
class PetRequest(BaseModel):
    phone: str
    petName: str = "Rocky"
    userName: str = "User"

try:
    init_db()
except Exception:
    print("🚀 Server starting in 'Offline Mode' (Database disconnected)")

class CyberPet:
    def __init__(self, name):
        self.name = name
        self.hunger = 10
        self.is_active = True
        self.is_sleep = False
        self.status_message = "Welcome!"
        self.tick_speed = 3
        self.thread_started = False  # Track thread to prevent stacking

    def to_dict(self):
        return {
            "name": self.name,
            "hunger": self.hunger,
            "is_sleep": self.is_sleep,
            "is_active": self.is_active,
            "message": self.status_message
        }

    def sleep(self):
        self.is_sleep = True
        self.tick_speed = 3

    def update_message(self, text):
        self.status_message = text

    def check_and_wake(self):
        if self.is_sleep:
            self.wake_up()
            return True
        return False

    def wake_up(self):
        self.is_sleep = False
        self.is_active = True
        self.hunger = 10
        self.update_message(f"Wake up {self.name}!!")

    def autohunger(self):
        while True: 
            time.sleep(self.tick_speed)
            if self.is_active and not self.is_sleep:
                if self.hunger > 0:
                    self.hunger -= 1
                    if self.hunger == 0:
                        self.sleep()
                        self.update_message(f"{self.name} fell asleep from hunger! 💤")
                    elif self.hunger <= 2:
                        self.update_message(f"{self.name} is really hungry! 🍖")
                    else:
                        self.update_message(f"{self.name} is feeling peckish.")

    def feed_button_triggered(self):
        if self.check_and_wake(): return
        if self.hunger < 10:
            self.hunger += 1
            self.update_message(f"You fed {self.name}! He is happy.")
        else:
            self.update_message(f"{self.name} is full!")

    def dance(self):
        if self.check_and_wake(): return
        self.update_message(f"{self.name} is dancing.")

    def petting(self):
        if self.check_and_wake(): return
        self.hunger -= 1
        self.tick_speed = 2
        if self.hunger <= 0:
            self.hunger = 0
            self.sleep()
            self.update_message(f"You petted {self.name} to sleep! 💤")
        else:
            self.update_message(f"You petted {self.name}! He's getting sleepy...")

app = FastAPI()
active_pets = {}
click_counters = {}

def execute_action(phone: str, action_func, action_type: str):
    phone = phone.strip()
    if phone not in active_pets:
        raise HTTPException(status_code=404, detail="Pet not found")

    current_pet = active_pets[phone]
    action_func() 
    
    # Logic: Only save to DB every 5th action to prevent pool exhaustion
    click_counters[phone] = click_counters.get(phone, 0) + 1
    
    if click_counters[phone] == 1 or click_counters[phone] % 5 == 0:
        def background_db_update():
            try:
                log_action_smart(action_type)
                save_user_pet(phone, "User", current_pet.name, current_pet.hunger, current_pet.is_sleep)
            except Exception as e:
                print(f"Background Save Failed: {e}")

        t = threading.Thread(target=background_db_update, daemon=True)
        t.start()
    
    return current_pet.to_dict()

# --- Middleware ---

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Routes ---

@app.get("/status")
def get_status(phone: str = None):
    if not phone:
        return {"name": "Unknown", "hunger": 0, "message": "No phone provided."}
    
    phone = phone.strip()

    # 1. Check if the pet is already "active" in memory (No DB trip needed!)
    if phone in active_pets:
        return active_pets[phone].to_dict()

    # 2. If not in memory, try to load from Database
    try:
        existing_user = get_user_pet(phone)
        if existing_user:
            saved_user_name, saved_pet_name, saved_hunger, saved_sleep = existing_user
            
            # Load into RAM
            new_pet = CyberPet(saved_pet_name)
            new_pet.hunger = saved_hunger
            new_pet.is_sleep = bool(saved_sleep)
            new_pet.update_message(f"Welcome back!")
            active_pets[phone] = new_pet



            if not new_pet.thread_started:
                new_pet.thread_started = True
                t = threading.Thread(target=new_pet.autohunger, daemon=True)
                t.start()
                
            return active_pets[phone].to_dict()
            
    except Exception as e:
        print(f"❌ DB Error in /status: {e}")
        # If DB fails, we still return a graceful message instead of crashing
        return {"name": "Error", "hunger": 0, "message": "Database busy. Try again!"}
    
    return {"name": "Unknown", "hunger": 0, "message": "Please log in."}

@app.post("/feed")
def feed_pet(data: PetRequest):
    # Added "feed" as the 3rd argument
    return execute_action(data.phone, active_pets[data.phone].feed_button_triggered, "feed")

@app.post("/dance")
def dance_pet(data: PetRequest):
    # Added "dance" as the 3rd argument
    return execute_action(data.phone, active_pets[data.phone].dance, "dance")

@app.post("/petting")
def petting_pet(data: PetRequest):
    # Added "petting" as the 3rd argument
    return execute_action(data.phone, active_pets[data.phone].petting, "petting")

@app.post("/wake")
def wake_pet(data: PetRequest):
    # Added "wake" as the 3rd argument
    return execute_action(data.phone, active_pets[data.phone].wake_up, "wake")

@app.post("/setup")
def setup_pet(data: PetRequest):
    phone = data.phone.strip()
    
    if phone not in active_pets:
        existing_user = get_user_pet(phone)
        if existing_user:
            # Welcome back
            saved_user_name, saved_pet_name, saved_hunger, saved_sleep = existing_user
            new_pet = CyberPet(saved_pet_name)
            new_pet.hunger = saved_hunger
            new_pet.is_sleep = bool(saved_sleep)
            active_pets[phone] = new_pet
        else:
            # New User
            active_pets[phone] = CyberPet(data.petName)
            save_user_pet(phone, data.userName, data.petName, 10, False)

    # 3. LOG SESSION START (When the user logs in/enters)
  
    current_pet = active_pets[phone]
    if not current_pet.thread_started:
        current_pet.thread_started = True
        t = threading.Thread(target=current_pet.autohunger, daemon=True)
        t.start()
    
    return current_pet.to_dict()


@app.post("/logout")
def logout_pet(data: PetRequest):
    """Closes the session when user leaves."""
    phone = data.phone.strip()
    if phone in active_pets:
        del active_pets[phone]
    return {"message": "Logged out successfully"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)