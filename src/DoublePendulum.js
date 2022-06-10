// copied from https://github.com/theabbie/DoublePendulum

export class DoublePendulum {
    constructor({
      width,
      height,
      x0,
      y0,
      ang0,
      ang1,
      v0,
      v1,
      acc0,
      acc1,
      baseRad,
      l0,
      l1,
      r0,
      r1,
      m0,
      m1,
      g,
      massScaleFactor,
      speedScaleFactor,
      dt,
      fps,
    }) {
      this.width = width;
      this.height = height;
      this.x0 = x0;
      this.y0 = y0;
      this.ang0 = ang0;
      this.ang1 = ang1;
      this.v0 = v0;
      this.v1 = v1;
      this.acc0 = acc0;
      this.acc1 = acc1;
      this.baseRad = baseRad;
      this.l0 = l0;
      this.l1 = l1;
      this.r0 = r0;
      this.r1 = r1;
      this.m0 = m0;
      this.m1 = m1;
      this.g = g;
      this.upperBobHold = false;
      this.lowerBobHold = false;
      this.baseHold = false;
      this.massScaleFactor = massScaleFactor;
      this.speedScaleFactor = speedScaleFactor;
      this.dt = dt;
      this.fps = fps;
      this.setMoments();
    }

    setWidth(w) {
      this.width = w;
    }

    setHeight(h) {
      this.height = h;
    }

    setUpperAngle(ang) {
      this.ang0 = ang;
    }

    setLowerAngle(ang) {
      this.ang1 = ang;
    }

    setUpperVelocity(vel) {
      this.v0 = vel;
    }

    setLowerVelocity(vel) {
      this.v1 = vel;
    }

    setUpperAcceleration(acc) {
      this.acc0 = acc;
    }

    setLowerAcceleration(acc) {
      this.acc1 = acc;
    }

    increaseSpeed() {
      this.dt *= this.speedScaleFactor;
    }

    decreaseSpeed() {
      this.dt /= this.speedScaleFactor;
    }

    increaseUpperMass() {
      this.m0 *= this.massScaleFactor;
    }

    decreaseUpperMass() {
      this.m0 /= this.massScaleFactor;
    }

    increaseLowerMass() {
      this.m1 *= this.massScaleFactor;
    }

    decreaseLowerMass() {
      this.m1 /= this.massScaleFactor;
    }

    setGravity(gravity) {
      this.g = gravity;
    }

    setMoments() {
      const { m0, m1, ang0, ang1, l0, l1, v0, v1 } = this;
      const commonVal = m1 * l0 * l1 * Math.cos(ang0 - ang1);
      this.moment0 = (m0 + m1) * l0 ** 2 * v0 + v1 * commonVal;
      this.moment1 = m1 * l1 ** 2 * v1 + v0 * commonVal;
    }

    setBasePos(x, y) {
      const upperBob = this.getUpperBob();
      const [distX, distY] = [upperBob.x - x, upperBob.y - y];
      this.x0 = x;
      this.y0 = y;
      this.l0 = Math.sqrt(distX ** 2 + distY ** 2);
      this.ang0 = Math.atan2(distX, distY);
    }

    setUpperBobPos(x, y) {
      const [distX, distY] = [x - this.x0, y - this.y0];
      this.l0 = Math.sqrt(distX ** 2 + distY ** 2);
      this.ang0 = Math.atan2(distX, distY);
    }

    setLowerBobPos(x, y) {
      const upperBobPos = this.getUpperBob();
      const [distX, distY] = [x - upperBobPos.x, y - upperBobPos.y];
      this.l1 = Math.sqrt(distX ** 2 + distY ** 2);
      this.ang1 = -Math.atan2(distX, distY);
    }

    holdBase() {
      this.baseHold = true;
    }

    holdUpperBob() {
      this.upperBobHold = true;
    }

    holdLowerBob() {
      this.lowerBobHold = true;
    }

    dropBase() {
      this.baseHold = false;
    }

    dropUpperBob() {
      this.upperBobHold = false;
    }

    dropLowerBob() {
      this.lowerBobHold = false;
    }

    calculateBobPosition(x0, y0, angle, len) {
      const offsetX = len * Math.sin(angle);
      const offsetY = len * Math.cos(angle);
      const x = x0 + offsetX;
      const y = y0 + offsetY;
      return { x, y };
    }

    getUpperBob() {
      const { x0, y0, ang0, l0 } = this;
      const { x, y } = this.calculateBobPosition(x0, y0, ang0, l0);
      return { x, y };
    }

    getLowerBob() {
      const upperBobPos = this.getUpperBob();
      const { ang1, l1 } = this;
      const { x, y } = this.calculateBobPosition(
        upperBobPos.x,
        upperBobPos.y,
        -ang1,
        l1
      );
      return { x, y };
    }

    getAngularVelocities() {
      const { ang0, ang1, l0, l1, v0, v1, r0, r1, m0, m1, g } = this;
      const cos0 = Math.cos(ang0);
      const sin0 = Math.sin(ang0);
      const cosDiff = Math.cos(ang0 - ang1);
      const sinDiff = Math.sin(ang0 - ang1);
      const cos2Diff = Math.cos(2 * (ang0 - ang1));
      const sinAng2Diff = Math.sin(ang0 - 2 * ang1);
      const velAng0 = l0 * v0 * v0;
      const velAng1 = l1 * v1 * v1;
      const massSum = m0 + m1;
      const doubleMass1Sum = 2 * m0 + m1;
      const baseVal = doubleMass1Sum - m1 * cos2Diff;
      const ang0Val = velAng1 + velAng0 * cosDiff;
      const ang0UpperVal =
        -g * doubleMass1Sum * sin0 -
        m1 * g * sinAng2Diff -
        2 * sinDiff * m1 * ang0Val;
      const acc0 = ang0UpperVal / (l0 * baseVal);
      const ang1Val = (velAng0 + g * cos0) * massSum + velAng1 * m1 * cosDiff;
      const ang1UpperVal = 2 * sinDiff * ang1Val;
      const acc1 = ang1UpperVal / (l1 * baseVal);
      this.setUpperAcceleration(acc0);
      this.setLowerAcceleration(acc1);
      return { acc0, acc1 };
    }

    hamiltonian(ang0, ang1, moment0, moment1) {
      const { m0, m1, l0, l1, g } = this;
      const C0 = l0 * l1 * (m0 + m1 * Math.sin(ang0 - ang1) ** 2);
      const C1 = (moment0 * moment1 * Math.sin(ang0 - ang1)) / C0;
      const C2 =
        ((m1 * (l1 * moment0) ** 2 +
          (m0 + m1) * (l0 * moment1) ** 2 -
          2 * l0 * l1 * m1 * moment0 * moment1 * Math.cos(ang0 - ang1)) *
          Math.sin(2 * (ang0 - ang1))) /
        (2 * C0 ** 2);
      const F_ang0 =
        (l1 * moment0 - l0 * moment1 * Math.cos(ang0 - ang1)) / (l0 * C0);
      const F_ang1 =
        (l0 * (m0 + m1) * moment1 -
          l1 * m1 * moment0 * Math.cos(ang0 - ang1)) /
        (l1 * m1 * C0);
      const F_moment0 = -(m0 + m1) * g * l0 * Math.sin(ang0) - C1 + C2;
      const F_moment1 = -m1 * g * l1 * Math.sin(ang1) + C1 - C2;
      return [F_ang0, F_ang1, F_moment0, F_moment1];
    }

    move() {
      const { ang0, ang1, moment0, moment1, dt } = this;
      const curr = [ang0, ang1, moment0, moment1];
      const k1 = this.hamiltonian(...curr);
      const k2 = this.hamiltonian(
        ...curr.map((_c, _i) => _c + 0.5 * dt * k1[_i])
      );
      const k3 = this.hamiltonian(
        ...curr.map((_c, _i) => _c + 0.5 * dt * k2[_i])
      );
      const k4 = this.hamiltonian(...curr.map((_c, _i) => _c + dt * k3[_i]));
      const R = [0, 0, 0, 0].map(
        (_c, _i) => (dt * (k1[_i] + 2 * k2[_i] + 2 * k3[_i] + k4[_i])) / 6
      );
      this.ang0 += R[0];
      this.ang1 += R[1];
      this.moment0 += R[2];
      this.moment1 += R[3];
      this.ang0 = ((3 * Math.PI + this.ang0) % (2 * Math.PI)) - Math.PI;
      this.ang1 = ((3 * Math.PI + this.ang1) % (2 * Math.PI)) - Math.PI;
    }
}