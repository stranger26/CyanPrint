import program from 'commander';
import {Utility} from "./classLibrary/Utility";
import {InstallTemplate} from "./install";
import chalk from 'chalk';
import {
	CreateGroup,
	DeleteGroup,
	ExistGroup,
	InstallGroup,
	ListGroup,
	ListTemplates,
	PushGroup,
	UpdateGroup
} from "./group";
import {Core, Kore} from "@kirinnee/core";
import {Try} from "./try";
import {Permute} from "./permute";
import {Create} from "./create";
import {ObjectX, Objex} from "@kirinnee/objex";
import {Dependency} from "./Depedency";
import {ApiSdk} from "./classLibrary/sdk/ApiSdk";
import {IAutoInquire, IAutoMapper} from "./classLibrary/TargetUtil/CyanResponse";
import {AutoInquire} from "./classLibrary/TargetUtil/AutoInquire";
import {AutoMapper} from "./classLibrary/TargetUtil/AutoMapper";
import {RemoveTemplate} from "./remove";
import {UpdateEverything, UpdateTemplate, UpdateTemplatesInGroup} from "./upgrade";
import {GroupResponse} from "./classLibrary/GroupData";
import {PushTemplate} from "./push";

declare global {
	interface String {
		isFile(): boolean;
		
		FileName(): string;
	}
	
	const VERSION: string;
	const PRODUCTION: boolean;
}

const core: Core = new Kore();
core.ExtendPrimitives();

const objex: Objex = new ObjectX(core);
objex.ExtendPrimitives();

const u: Utility = new Utility(core);
const api: ApiSdk = new ApiSdk(PRODUCTION ? "https://cyanprint.icu" : "https://cyanprint.icu");
const autoMapper: IAutoMapper = new AutoMapper(u);
const autoInquirer: IAutoInquire = new AutoInquire(u, autoMapper);

const dep: Dependency = {
	core,
	objex,
	util: u,
	api,
	autoInquirer,
	autoMapper,
};

program
	.version(VERSION);

// error on unknown commands
program
	.on('command:*', function () {
		console.error('Invalid command: %s\nSee --help for a list of available commands.', program.args.join(' '));
		process.exit(1);
	});

const create = async function (folderName: string) {
	let reply: string = await Create(dep, folderName);
	console.log(reply);
	process.exit(0);
};
const group = async function (action: string, key: string, name: string, email: string) {
	switch (action.toLowerCase()) {
		case "c":
		case "create":
			if (name != null && key != null && email != null) {
				console.log(CreateGroup(key, name, email, "README.MD"));
			} else {
				console.log(chalk.yellowBright("Usage:") + " group create <group-key> <group-name> <author-email>");
			}
			break;
		case "r":
		case "delete":
			if (key != null) {
				const r = await DeleteGroup(key);
				console.log(r);
			} else {
				console.log(chalk.yellowBright("Usage:") + " group delete <group-key>");
			}
			break;
		case "l":
		case "list":
			if (key == null) {
				console.log(ListGroup());
			} else {
				console.log(ListTemplates(key));
			}
			break;
		case "i":
		case "install":
			if (key != null) {
				const r = await InstallGroup(dep, key);
				console.log(r)
			} else {
				console.log(chalk.yellowBright("Usage:") + " group install <group-key>");
			}
			break;
		case "u":
		case "update":
			if (key != null) {
				const r = await UpdateGroup(dep, key);
				console.log(r);
			} else {
				console.log(chalk.yellowBright("Usage:") + " group update <group-key>");
			}
			break;
		case "p":
		case "push":
			if (key != null && name != null) {
				const r = await PushGroup(dep, key, name);
				console.log(r);
			} else {
				console.log(chalk.yellowBright("Usage:") + " group push <group-key> <secret-token>");
			}
			break;
		default:
			console.log(chalk.redBright("Unknown group sub-command: available commands: \n\tcreate - creates a new group\n\tdelete - deletes a group\n\tlist - show the list of groups\n\tupdate - update the group and all its template\n\tinstall - install a group from online repository\n\tpush - pushes the group to online host"));
	}
	process.exit(0);
};
const permute = async function (from: string, to: string, cmd) {
	
	let copyNode: boolean = cmd["copyNode"] != null;
	let git: boolean = cmd["git"] != null;
	let reply = await Permute(dep, git, copyNode, from, to);
	console.log(reply);
	process.exit(0);
};
const install = function (link, dir, cmd) {
	let group: string = dir || "main";
	let copyNode: boolean = cmd["copyNode"] != null;
	if (ExistGroup(group)) {
		InstallTemplate(link, group, copyNode, dep)
			.then(reply => console.log(reply))
			.then(() => process.exit(0));
	} else {
		console.log(chalk.redBright("Group ") + chalk.yellow(group) + chalk.redBright(" does not exist!"));
		process.exit(0);
	}
};
const tryRun = async function (from: string, to: string, cmd) {
	
	let copyNode: boolean = cmd["copyNode"] != null;
	let git: boolean = cmd["git"] != null;
	
	let reply = await Try(dep, from, to, git, copyNode);
	console.log(reply);
	process.exit(0);
};
const remove = async function (group: string, key: string) {
	const reply = await RemoveTemplate(dep, key, group);
	console.log(reply);
	process.exit(0);
};

const update = async function (group: string, key: string) {
	if (group == null) {
		const r = await UpdateEverything(dep);
		console.log(r);
	} else if (key == null) {
		const reply = await UpdateTemplatesInGroup(dep, group);
		console.log(reply);
	} else {
		const reply = await UpdateTemplate(dep, key, group);
		console.log(reply);
	}
	process.exit(0);
};

program
	.command("create <app-name>")
	.description("create a project from installed templates")
	.action(create);

program
	.command("c <app-name>")
	.description("create a project from installed templates")
	.action(create);

program
	.command("install <dir> [group]")
	.description("install templates from git or from local machine")
	.option("-N --copy-node", "Copies node_module to target area")
	.action(install);


program
	.command("i <dir> [group]")
	.description("install templates from git or from local machine")
	.option("-N --copy-node", "Copies node_module to target area")
	.action(install);

program
	.command("g <action> [key] [name] [email]")
	.description("Group functions - [create (c), deleted (d), list (l), install (i)]")
	.action(group);
program
	.command("group <action> [key] [name] [email]")
	.description("Group functions - [create (c), deleted (d), list (l), install (i)]")
	.action(group);

program
	.command("permute <from> <to>")
	.description("Permute all possible outcome of the template")
	.option("-N --copy-node", "Copies node_module to target area")
	.option("-G --git", "Simulates a git install from local folders, the target folder needs to be a git repository")
	.action(permute);

program
	.command("try <from> <to>")
	.description("Try out the template")
	.option("-N --copy-node", "Copies node_module to target area")
	.option("-G --git", "Simulates a git install from local folders, the target folder needs to be a git repository")
	.action(tryRun);

program
	.command("remove <group> <key>")
	.description("Deletes or removes the template from the group")
	.action(remove);

program
	.command("r <group> <key>")
	.description("Deletes or removes the template from the group")
	.action(remove);


program
	.command("upgrade [group] [key]")
	.description("updates a template of a group")
	.action(update);

program
	.command("u [group] [key]")
	.description("updates a template of a group")
	.action(update);

program
	.command("test")
	.action(async () => {
		const gd: GroupResponse = await api.GetGroupData("sample");
		const content = await api.getReadMeContent(gd.readme);
		console.log(content);
	});

program
	.command("push <secret>")
	.description("Pushes the CyanPrint template in the current directory to the repository.")
	.action(async (secret) => {
		if (secret == null) {
			console.log(chalk.yellowBright("Usage:") + " push <secret>");
			process.exit(1);
		} else {
			const r = await PushTemplate(dep, secret);
			console.log(r);
			const compare = chalk.greenBright("Successfully");
			if (compare.Take(10) !== r.Take(10)) {
				process.exit(1);
			}
		}
	});

program.parse(process.argv);

let NO_COMMAND_SPECIFIED = program.args.length === 0;

if (NO_COMMAND_SPECIFIED) {
	program.help();
}
