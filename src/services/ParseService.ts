import { signOut } from "next-auth/react";
import Parse from "parse";

const globalErrorHandler = (error: Parse.Error) => {
  switch (error.code) {
    case Parse.Error.INVALID_SESSION_TOKEN:
      Parse.User.logOut();
      console.log("Invalid session token");
      signOut();
  }
};

export default class ParseService {
  static createdSchemas: any = [];

  static logout() {
    Parse.User.logOut();
  }

  static async setUser(session: string) {
    try {
      const user = await Parse.User.become(session);

      //Call Cloud Function to generate JWT
      const jwtResponse = await Parse.Cloud.run("generateJWTToken", {
        userId: user.id,
        claims: {
          name: user.get("email") || user.get("username") || "unknown",
          email: user.get("email") || "unknown@unknown.com",
          issuer: "AP",
          audience: "AP",
          scope: "ap_users",
        },
      });

      console.log("JWT token received:", jwtResponse.token);

      // Optional: Store the JWT for later use
      localStorage.setItem("jwtToken", jwtResponse.token);
    } catch (error) {
      console.error("Error in setUser or generating JWT:", error);
      Parse.User.logOut();
      await signOut();
    }
  }
  /**
   * get a record from the parse database
   * @param collectionName
   * @param id
   * @returns
   */
  static async get(collectionName: string, id: string) {
    const Collection = Parse.Object.extend(collectionName);
    const query = new Parse.Query(Collection);
    query.equalTo("objectId", id);
    return query.first().catch((e) => {
      globalErrorHandler(e);
      console.log(`get: Error getting record with collectionName ${collectionName} and id ${id} with error ${e}`);
    });
  }

  /**
   * get a record from the parse database
   * @param className
   * @param whereFields
   * @param whereValues
   * @param includesValues
   * @returns
   */
  static async getRecord(
    className: string,
    whereFields: string[] = [],
    whereValues: any[] = [],
    includesValues: any[] = []
  ): Promise<Parse.Object | undefined> {
    if (whereFields.length !== whereValues.length) {
      throw new Error("The number of whereFields and whereValues must match");
    }
    const query = new Parse.Query(className);
    whereFields.forEach((whereField, i) => query.equalTo(whereField, whereValues[i]));
    includesValues.forEach((includeValue) => query.include(includeValue));
    const record = await query.first().catch(globalErrorHandler);
    return record || undefined;
  }

  /**
   * get records from the parse database
   * @param className
   * @param whereFields
   * @param whereValues
   * @param include
   * @param limit
   * @param skip
   * @param order
   * @param orderDirection
   * @param nonNullFields
   * @returns
   * @constructor
   * @throws {Error} if the number of whereFields and whereValues do not match
   */
  static async getRecords(
    className: string,
    whereFields: string[] = [],
    whereValues: any[] = [],
    include: any[] = [],
    limit: number = 1000,
    skip: number = 0,
    order: string = "createdAt",
    orderDirection: string = "asc",
    nonNullFields: string[] = []
  ) {
    try {
      if (whereFields.length !== whereValues.length) {
        throw new Error("The number of whereFields and whereValues must match");
      }
      const query = new Parse.Query(className);

      if (typeof whereFields == "string") {
        query.containedIn(whereFields, whereValues);
      } else {
        for (let i = 0; i < whereFields.length; i++) {
          if (typeof whereValues[i] == "object" && whereValues[i].length > 0) {
            query.containedIn(whereFields[i], whereValues[i]);
          } else {
            query.equalTo(whereFields[i], whereValues[i]);
          }
        }
      }

      include.forEach((i: any) => query.include(i));

      nonNullFields.forEach((field: string) => {
        query.exists(field);
      });

      query.limit(limit);
      // order by direction
      if (orderDirection === "asc") {
        query.ascending(order);
      } else {
        query.descending(order);
      }

      const records = await query.find().catch(globalErrorHandler);
      return records;
    } catch (e) {
      console.log(`getRecords: Error getting records with className ${className} and whereFields ${whereFields} and whereValues ${whereValues}`);
    }
  }

  /**
   * get a record from the parse database
   * @param className
   * @param whereFields
   * @param whereValues
   * @returns
   * @constructor
   * @throws {Error} if the number of whereFields and whereValues do not match
   */
  static async getFirstRecord(className: string, whereFields: string[], whereValues: any[]) {
    try {
      if (whereFields.length !== whereValues.length) {
        throw new Error("The number of whereFields and whereValues must match");
      }
      const query = new Parse.Query(className);
      for (let i = 0; i < whereFields.length; i++) {
        query.equalTo(whereFields[i], whereValues[i]);
      }
      const record = await query.first().catch(globalErrorHandler);
      return record;
    } catch (e) {
      console.log(`getFirstRecord: Error getting record with className ${className} and whereFields ${whereFields} and whereValues ${whereValues}`);
    }
  }

  static async getLatestRecord(className: string, whereFields: string[], whereValues: any[]) {
    try {
      if (whereFields.length !== whereValues.length) {
        throw new Error("The number of whereFields and whereValues must match");
      }
      const query = new Parse.Query(className);
      for (let i = 0; i < whereFields.length; i++) {
        query.equalTo(whereFields[i], whereValues[i]);
      }
      query.descending("createdAt");
      const record = await query.first().catch(globalErrorHandler);
      return record;
    } catch (e) {
      console.log(`getLatestRecord: Error getting record with className ${className} and whereFields ${whereFields} and whereValues ${whereValues}`);
    }
  }

  /**
   * update a record in the parse database
   * @param collectionName
   * @param collectionIdFields
   * @param collectionIds
   * @param data
   * @returns
   */
  static async updateExistingRecord(collectionName: any, collectionIdFields: any, collectionIds: any, data: any) {
    try {
      console.log(
        `updateExistingRecord: Updating existing record with collectionName ${collectionName} and collectionIdFields ${collectionIdFields} and collectionIds ${collectionIds} and data ${data}`
      );
      const Collection = Parse.Object.extend(collectionName);
      const query = new Parse.Query(Collection);
      console.log("collectionIdFields", collectionIdFields);
      console.log("query", query);
      collectionIdFields.forEach((cif: any, i: number) => query.equalTo(cif, collectionIds[i]));
      return query.first().then((record: any) => {
        if (record) {
          Object.keys(data).forEach((key: any, i: number) => record.set(key, data[key]));
          return record.save();
        } else {
          throw new Error("Record not found");
        }
      }, globalErrorHandler);
    } catch (e) {
      console.log(
        `updateExistingRecord: Error updating existing record with collectionName ${collectionName} and collectionIdFields ${collectionIdFields} and collectionIds ${collectionIds} and data ${data}`
      );
    }
  }

  /**
   * create a record in the parse database. Throws an error if the record already exists
   * @param collectionName
   * @param collectionIdFields
   * @param collectionIdsValues
   * @param data
   * @returns {Promise<Parse.Object>}
   */
  static async createRecord(
    collectionName: any,
    collectionIdFields: any = [],
    collectionIdsValues: any = [],
    data: any = {}
  ): Promise<Parse.Object | undefined> {
    try {
      const Collection = Parse.Object.extend(collectionName);
      const query = new Parse.Query(Collection);
      if (collectionIdFields.length > 0) {
        collectionIdFields.forEach((cif: any, i: number) => query.equalTo(cif, collectionIdsValues[i]));
        const record = await query.first().catch(globalErrorHandler);
        if (record) {
          throw new Error("Record already exists");
        } else {
          const newRecord = new Collection();
          return newRecord.save(data);
        }
      } else {
        const newRecord = new Collection();
        return newRecord.save(data);
      }
    } catch (e: any) {
      console.log(
        `createRecord: Error creating record with collectionName ${collectionName} and collectionIdFields ${collectionIdFields} and collectionIdsValues ${collectionIdsValues}  ${e.message}`
      );
    }
  }

  static async createRecords(
    collectionName: any,
    collectionIdFields: any = [],
    collectionIdsValues: any = [],
    data: any = {}
  ): Promise<Parse.Object | undefined> {
    try {
      const Collection = Parse.Object.extend(collectionName);
      const query = new Parse.Query(Collection);
      if (collectionIdFields.length > 0) {
        collectionIdFields.forEach((cif: any, i: number) => query.equalTo(cif, collectionIdsValues[i]));
        const record = await query.first().catch(globalErrorHandler);
        if (record) {
          throw new Error("Record already exists");
        } else {
          const newRecord = new Collection();
          return newRecord.save(data);
        }
      } else {
        const newRecord = new Collection();
        return newRecord.save(data);
      }
    } catch (e: any) {
      console.log(
        `createRecord: Error creating record with collectionName ${collectionName} and collectionIdFields ${collectionIdFields} and collectionIdsValues ${collectionIdsValues}  ${e.message}`
      );
    }
  }

  /**
   * delete a record in the parse database
   * @param collectionName
   * @param collectionId
   * @returns
   */
  static async deleteRecord(collectionName: any, collectionId: any) {
    try {
      const Collection = Parse.Object.extend(collectionName);
      const query = new Parse.Query(Collection);
      query.equalTo("objectId", collectionId);
      const record = await query.first().catch(globalErrorHandler);
      if (record) {
        return await record.destroy().catch(globalErrorHandler);
      }
    } catch (e) {
      console.log(`deleteRecord: Error deleting record with collectionName ${collectionName} and collectionId ${collectionId}`);
    }
  }

  /**
   * save all record in the parse database
   * @param records
   */
  static async saveAll(records: any) {
    try {
      const allRecords = [];
      for (let i = 0; i < records.length; i++) {
        if (records[i] instanceof Parse.Object) {
          allRecords.push(records[i]);
        } else {
          allRecords.push(new Parse.Object(records[i].className, records[i]));
        }
      }
      for (let i = 0; i < allRecords.length; i++) {
        await allRecords[i].save(null);
        console.log(`saveAll: Saved record ${allRecords[i].attributes}`);
      }
    } catch (e) {
      console.log(`saveAll: Error saving records ${records}`);
    }
  }

  /**
   * save all record in the parse database
   * @param collectionName
   * @param records
   */
  static async saveAllFor(collectionName: string, records: any) {
    try {
      const allRecords = [];
      for (let i = 0; i < records.length; i++) {
        if (records[i] instanceof Parse.Object) {
          allRecords.push(records[i]);
        } else {
          allRecords.push(new Parse.Object(collectionName, records[i]));
        }
      }
      for (let i = 0; i < allRecords.length; i++) {
        await allRecords[i].save(null);
        console.log(`saveAllFor: Saved record ${allRecords[i]}`);
      }
    } catch (e) {
      console.log(`saveAllFoe: Error saving records ${records}`);
    }
  }

  /**
   * get a parse schema
   * @param className
   * @returns
   */
  static async getSchema(className: string) {
    try {
      const query = new Parse.Query("_SCHEMA");
      query.equalTo("className", className);
      return await query.first().catch(globalErrorHandler);
    } catch (e) {
      console.log(`getSchema: Error getting schema for ${className}`);
    }
  }

  /**
   * save a parse schema
   * @param schema
   * @returns
   */
  static async saveSchema(schema: any) {
    try {
      return await schema.save();
    } catch (e) {
      console.log(`saveSchema: Error saving schema ${schema}`);
    }
  }

  /**
   * create a parse schema
   * @param className
   * @param fields
   * @returns
   */
  static async createSchema(className: string, fields: any) {
    try {
      // get all the existing schemas
      const schemas = await ParseService.getAllSchemas().catch(globalErrorHandler);

      // if the schema already exists, return
      if (!schemas) return;
      if (schemas.find((s: any) => s.className === className)) {
        return;
      }

      // to create a schema, we simply create an object of that class
      // then delete the object
      const Collection = Parse.Object.extend(className);
      const collection = new Collection();
      const fieldNames = Object.keys(fields);
      const fieldValues = fieldNames.map((fieldName) => {
        // check the field types and create an appropriate value
        const fieldType = fields[fieldName];
        switch (fieldType) {
          case "String":
            return "test";
          case "Number":
            return 1;
          case "Boolean":
            return true;
          case "GeoPoint":
            return new Parse.GeoPoint(0, 0);
          case "Polygon":
            return new Parse.Polygon([
              [0, 0],
              [0, 1],
              [1, 1],
              [1, 0],
            ]);
          case "Array":
            return ["test"];
          case "Object":
            return { test: "test" };
          default:
            return undefined;
        }
      });
      // set the field values
      fieldNames.forEach((fieldName, i) => {
        const fieldValue = fieldValues[i];
        if (!fieldValue) return;
        collection.set(fieldName, fieldValue);
      });

      // save the object
      await collection.save();

      // delete the object
      await collection.destroy();
    } catch (e) {
      console.log((e as any).message);
    }
  }

  /**
   * create multiple schemas
   * @param schemasList
   */
  static async createSchemas(schemasList: any) {
    const schemas = await ParseService.getAllSchemas().catch(globalErrorHandler);
    const schemaNames = schemas?.map((s: any) => s.className);
    for (let i = 0; i < schemasList.length; i++) {
      const collectionName = schemasList[i];
      if (!schemaNames?.includes(collectionName)) {
        await ParseService.createSchema(collectionName, {
          name: "string",
        });
      }
    }
  }

  /**
   * delete a collection and its schema
   * @param collectionName
   * @returns
   */
  static async deleteCollection(collectionName: string) {
    try {
      const query = new Parse.Query(collectionName);
      const records = await query.find().catch(globalErrorHandler);
      if (records) return await Parse.Object.destroyAll(records);
    } catch (e) {
      console.log(`deleteCollection: Error deleting collection ${collectionName}`);
    }
  }

  /**
   * delete a schema
   * @param className
   * @returns
   */
  static async deleteSchema(className: string) {
    try {
      const schema = await ParseService.getSchema(className);
      return schema ? await schema.destroy() : undefined;
    } catch (e) {
      console.log(`deleteSchema: Error deleting schema for ${className}`);
    }
  }

  /**
   * get all schemas in the parse database
   */
  static async getAllSchemas() {
    try {
      // this.initialize();
      return await Parse.Schema.all().catch(globalErrorHandler);
    } catch (e) {
      return [];
    }
  }

  /**
   * update a record in the parse database
   * @param collectionName
   * @param id
   * @param fields
   */
  static async updateRecord(collectionName: string | { className: string }, id: string, fields: { [x: string]: any }) {
    const Collection = Parse.Object.extend(collectionName);
    const collection = new Collection();
    collection.id = id;
    for (const key in fields) {
      collection.set(key, fields[key]);
    }
    console.log("collection", collection);
    await collection.save().catch(globalErrorHandler);
  }

  /**
   * createa a record in the parse database
   * @param collectionName
   * @param fields
   * @returns
   */
  static async create(collectionName: string, fields: { [x: string]: any }) {
    const Collection = Parse.Object.extend(collectionName);
    const collection = new Collection();
    for (const key in fields) {
      collection.set(key, fields[key]);
    }
    await collection.save().catch(globalErrorHandler);
    return collection;
  }

  /**
   * update a record in the parse database
   * @param collName
   * @param existingRecordId
   * @param objectToInsert
   * @returns
   */
  static async update(collName: string | { className: string }, existingRecordId: string, objectToInsert: { [x: string]: any }) {
    const Collection = Parse.Object.extend(collName);
    const collection = new Collection();
    collection.id = existingRecordId;
    for (const key in objectToInsert) {
      collection.set(key, objectToInsert[key]);
    }
    await collection.save().catch(globalErrorHandler);
    return collection;
  }

  static async createUser(registration: any) {
    const user = new Parse.User(registration);
    return user.signUp(registration);
  }

  static async setPublicAcl(user: Parse.User) {
    // Create a new ACL object
    const acl = new Parse.ACL();

    // Set public read and write access
    acl.setPublicReadAccess(true);

    // Assign the ACL to the user
    user.setACL(acl);

    // Save the user with the new ACL
    try {
      await user.save().catch(globalErrorHandler);
    } catch (error) {
      // Handle error
      console.error("Error while saving user with new ACL:", error);
      throw error;
    }
  }
}
