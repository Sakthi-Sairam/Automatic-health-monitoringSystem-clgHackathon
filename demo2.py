import cv2
import time
import datetime
import numpy as np
from scipy.fftpack import fft, fftfreq, fftshift
from sklearn.decomposition import FastICA
from sklearn.preprocessing import StandardScaler
import matplotlib.pyplot as plt
import requests  

PATH_TO_HAAR_CASCADES = ""
face_cascade = cv2.CascadeClassifier(PATH_TO_HAAR_CASCADES + 'haarcascade_frontalface_default.xml')  # Full pathway must be used
firstFrame = None
time = []
R = []
G = []
B = []
pca = FastICA(n_components=3, max_iter=1000, tol=0.01)
cap = cv2.VideoCapture(0)

if not cap.isOpened():
    print("Failed to open webcam")
    sys.exit(1)

frame_num = 0
plt.ion()

num_measurements = 100
heart_rates = []

num_frames_for_analysis = 100

# Flask server URL
flask_server_url = 'http://127.0.0.1:5000/api/heart_rate'

while cap.isOpened():
    ret, frame = cap.read()
    if ret:
        frame_num += 1

        if firstFrame is None:
            start = datetime.datetime.now()
            time.append(0)

            firstFrame = frame
            cv2.imshow("frame", firstFrame)

            old_gray = cv2.cvtColor(firstFrame, cv2.COLOR_BGR2GRAY)
            faces = face_cascade.detectMultiScale(old_gray, scaleFactor=1.2, minNeighbors=5, minSize=(30, 30))

            if len(faces) == 0:
                firstFrame = None
            else:
                for (x, y, w, h) in faces:
                    expansion_factor = 0.2
                    x_expanded = int(x - expansion_factor * w)
                    y_expanded = int(y - expansion_factor * h)
                    w_expanded = int(w * (1 + 2 * expansion_factor))
                    h_expanded = int(h * (1 + 2 * expansion_factor))
                    cv2.rectangle(firstFrame, (x_expanded, y_expanded), (x_expanded + w_expanded, y_expanded + h_expanded), (255, 0, 0), 2)
                    cv2.imshow("frame", firstFrame)

                    VJ_mask = np.zeros_like(firstFrame)
                    VJ_mask = cv2.rectangle(VJ_mask, (x_expanded, y_expanded), (x_expanded + w_expanded, y_expanded + h_expanded), (255, 0, 0), -1)
                    VJ_mask = cv2.cvtColor(VJ_mask, cv2.COLOR_BGR2GRAY)

                ROI = VJ_mask
                ROI_color = cv2.bitwise_and(ROI, ROI, mask=VJ_mask)
                ROI_color = cv2.GaussianBlur(ROI_color, (5, 5), 0)  # Apply Gaussian blur to reduce noise
                cv2.imshow('ROI', ROI_color)

                R_new, G_new, B_new, _ = cv2.mean(ROI_color, mask=ROI)
                R.append(R_new)
                G.append(G_new)
                B.append(B_new)

        if cv2.waitKey(1) & 0xFF == ord('q'):
            sys.exit(1)
            break
        else:
            current = datetime.datetime.now() - start
            current = current.total_seconds()
            time.append(current)

            frame_gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
            ROI_color = cv2.bitwise_and(frame, frame)
            ROI_color = cv2.GaussianBlur(ROI_color, (5, 5), 0)  # Apply Gaussian blur to reduce noise
            cv2.imshow('ROI', ROI_color)

            R_new, G_new, B_new, _ = cv2.mean(ROI_color)
            R.append(R_new)
            G.append(G_new)
            B.append(B_new)

            if frame_num >= num_frames_for_analysis:
                N = num_frames_for_analysis
                G_std = StandardScaler().fit_transform(np.array(G[-(N - 1):]).reshape(-1, 1))
                G_std = G_std.reshape(1, -1)[0]
                R_std = StandardScaler().fit_transform(np.array(R[-(N - 1):]).reshape(-1, 1))
                R_std = R_std.reshape(1, -1)[0]
                B_std = StandardScaler().fit_transform(np.array(B[-(N - 1):]).reshape(-1, 1))
                B_std = B_std.reshape(1, -1)[0]

                T = 1 / (len(time[-(N - 1):]) / (time[-1] - time[-(N - 1)]))
                X_f = pca.fit_transform(np.array([R_std, G_std, B_std]).transpose()).transpose()
                N = len(X_f[0])

                yf = fft(X_f[1])
                yf = yf / np.sqrt(N)
                xf = fftfreq(N, T)
                xf = fftshift(xf)
                yplot = fftshift(abs(yf))

                plt.figure(1)
                plt.gcf().clear()
                fft_plot = yplot
                heart_rate_range = (0.75, 4)
                fft_plot[(xf < heart_rate_range[0]) | (xf > heart_rate_range[1])] = 0

                # Print the detected heart rate
                heart_rate_index = xf[fft_plot[xf <= 4].argmax()]
                heart_rate_bpm = heart_rate_index * 60
                print(f"Detected heart rate: {heart_rate_bpm:.2f} BPM")

                heart_rates.append(heart_rate_bpm)

                payload = {'user_id': 'your_user_id', 'heart_rate': heart_rate_bpm}
                response = requests.post(flask_server_url, json=payload)

                if response.status_code == 200:
                    print("Heart rate sent successfully to Flask server")
                else:
                    print(f"Failed to send heart rate. Status code: {response.status_code}")

                # Plot the FFT
                plt.plot(xf[(xf >= 0) & (xf <= 4)], fft_plot[(xf >= 0) & (xf <= 4)])
                plt.pause(0.0001)

            if len(heart_rates) >= num_measurements:
                # Calculate and print average heart rate
                average_heart_rate = np.median(heart_rates) 
                print(f"Average heart rate over {num_measurements} measurements: {average_heart_rate:.2f} BPM")
                # Turn off the system
                cap.release()
                cv2.destroyAllWindows()

                # Display the average heart rate
                cv2.putText(frame, f"Average HR: {average_heart_rate:.2f} BPM", (50, 50), cv2.FONT_HERSHEY_SIMPLEX, 1, (255, 255, 255), 2)
                cv2.imshow("Average Heart Rate", frame)
                cv2.waitKey(0)
                cv2.destroyAllWindows()

                break
