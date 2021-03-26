const db = require("../db");
const response = require("../model/response");
const Joi = require("joi");
const reqSchema = {
  getUserDetails: {
    mobile_no: Joi.number()
      .required()
      .min(1000000000)
      .max(9999999999)
      .label("Mobile no."),
    password: Joi.string().required().max(20),
  },
  registerNewUser: {
    mobile_no: Joi.number()
      .required()
      .min(1000000000)
      .max(9999999999)
      .label("Mobile no."),
    password: Joi.string().required().max(20),
  },
  updateUser: {
    mobile_no: Joi.string().required(),
    // password: Joi.string().required(),
    email: Joi.string(),
    name: Joi.string(),
    gender: Joi.string(),
    date_of_birth: Joi.date().raw(),
  },
};
class User {
  async login_with_password(req, res) {
    const { body } = req;
    const result = Joi.validate(body, reqSchema.getUserDetails);
    if (result.error) {
      res.json(response(false, result.error.details[0].message, result.error));
      return;
    }
    let row = await db.get_row("SELECT * FROM users WHERE mobile_no = ?", [
      body.mobile_no,
    ]);
    if (row !== null) {
      if (row.password === body.password) {
        res.json(response(true, "success", row));
      } else {
        res.json(response(false, "username & password doesn't match"));
      }
    } else {
      res.json(response(false, "Please enter correct mobile number", row));
    }
  }
  async get_user_details(req, res) {
    const { body } = req;
    let row = await db.get_row(
      "SELECT mobile_no,email,name,gender,date_of_birth,img  FROM users WHERE id = ?",
      [body.id]
    );
    res.json(response(true, "success", row));
  }
  async register_new_user(req, res) {
    const { body } = req;
    const result = Joi.validate(body, reqSchema.registerNewUser);
    if (result.error) {
      res.json(response(false, result.error.details[0].message, result.error));
      return;
    }

    let exist_user = await db.get_row(
      "SELECT * FROM users WHERE mobile_no = ?",
      [body.mobile_no]
    );
    // console.log(exist_user.id);
    if (exist_user !== null) {
      if (exist_user.mobile_no === body.mobile_no) {
        res.json(response(false, "Mobile number already exist", {}));
        return;
      }
    } else {
      let q = "INSERT INTO users (`mobile_no`, `password`) VALUES (?,?);";
      const insert_res = await db.query(q, [body.mobile_no, body.password]);
      if (insert_res.affectedRows >= 1) {
        let row = await db.get_row("SELECT * FROM users WHERE mobile_no = ?", [
          body.mobile_no,
        ]);
        const data = {
          userRegister: {
            row,
          },
        };
        res.json(response(true, "Created successfully", data));
      }
    }
  }
  async update_user_details(req, res) {
    // let update_req="UPDATE `users` SET `mobile_no`='9861177159', `password`='srgcv', `email`='scvg', `name`='esrc', `gender`='male', `dob`='2008-11-12', `date_of_birth`='2008-11-12' WHERE `id`='27';"
    const { body } = req;
    const result = Joi.validate(body, reqSchema.updateUser);
    if (result.error) {
      res.json(response(false, result.error.message, result.error));
    }
    let q = `UPDATE users SET mobile_no=?, email=?, name=?, gender=?, date_of_birth=? WHERE id=${req.params.id};`;

    const update_res = await db.query(q, [
      body.mobile_no,
      // body.password,
      body.email,
      body.name,
      body.gender,
      body.date_of_birth,
    ]);
    console.log(update_res);
    if (update_res.affectedRows >= 1) {
      res.json(response(true, "updated succeccfully", {}));
    }
  }
  async user_history(req, res) {
    const { body } = req;
    // console.log(window.location.hostname);
    let rows = await db.get_rows(
      `SELECT product.product_id,product.product_name,product.unit_quantity,product.image_url,product.product_category_id,product.default_amt, ROUND(product.product_price - (product.product_price*product.discount)/100) as discounted_price,product.product_price,product.discount FROM product inner join basket on basket.product_id=product.product_id where user_id=${body.user_id}`
    );
    rows.forEach((element) => {
      element.image_url = `/product_image/${element.image_url}`;
    });
    res.json(response(true, "success", rows));
  }
}
module.exports = new User();
