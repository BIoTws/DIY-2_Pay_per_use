import RPi.GPIO as GPIO
import sys
import time
GPIO.setwarnings(False)
GPIO.setmode(GPIO.BCM)
GPIO.setup(18,GPIO.OUT)
p=GPIO.PWM(18,50)
p.start(0)
print sys.argv[1]
try:
        p.ChangeDutyCycle(float(sys.argv[1]))
        time.sleep(1)
        print "end"
except KeyboardInterrupt:
        p.stop()
        GPIO.cleanup()